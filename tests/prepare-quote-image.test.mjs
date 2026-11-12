import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareQuoteImage } from "../utils/prepareQuoteImage.mjs";
import { MAX_QUOTE_IMAGE_BYTES, MAX_QUOTE_SOURCE_IMAGE_BYTES } from "../utils/quoteImage.mjs";
import { submitQuote } from "../utils/submitQuote.mjs";
import { readSubmission } from "../utils/server/formSubmissions.mjs";

const largePhoto = new File([new Uint8Array(MAX_QUOTE_IMAGE_BYTES + 1)], "phone.png", { type: "image/png" });
const jpeg = new Blob([await sharp({ create: { width: 16, height: 12, channels: 3, background: "red" } }).jpeg().toBuffer()], { type: "image/jpeg" });
function fakeBrowser(blobs = [jpeg], failsToDecode = false) {
  const calls = { sizes: [], qualities: [], revoked: [] };
  const canvas = {
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toBlob(callback, type, quality) {
      calls.sizes.push([canvas.width, canvas.height]);
      calls.qualities.push(quality);
      callback(blobs.length > 1 ? blobs.shift() : blobs[0]);
    },
  };
  return { calls, browser: {
    File,
    URL: { createObjectURL: () => "blob:photo", revokeObjectURL: url => calls.revoked.push(url) },
    Image: class {
      naturalWidth = 8000;
      naturalHeight = 6000;
      set src(value) { queueMicrotask(() => failsToDecode ? this.onerror() : this.onload()); }
    },
    document: { createElement: () => canvas },
  } };
}

test("small photos and omitted photos pass through without browser work", async () => {
  const file = new File([jpeg], "small.jpg", { type: "image/jpeg" });
  assert.equal(await prepareQuoteImage(file, {}), file);
  assert.equal(await prepareQuoteImage(null, {}), null);
});

test("resizes phone photos and sends the prepared file to both APIs", async () => {
  const { browser, calls } = fakeBrowser();
  const prepared = await prepareQuoteImage(largePhoto, browser);
  assert.equal(prepared.name, "phone.jpg");
  assert.equal(prepared.type, "image/jpeg");
  assert.ok(prepared.size <= MAX_QUOTE_IMAGE_BYTES);
  assert.deepEqual(calls.sizes, [[2560, 1920]]);
  assert.deepEqual(calls.revoked, ["blob:photo"]);
  for (const endpoint of ["/api/sendmail", "/api/submit-hubspot-form"]) {
    await submitQuote(endpoint, { email: "test@example.com" }, prepared, async (url, options) => {
      assert.equal(url, endpoint);
      const { image } = await readSubmission(new Request(`https://example.com${url}`, options));
      assert.equal(image.type, "image/jpeg");
      assert.deepEqual(Buffer.from(await image.arrayBuffer()), Buffer.from(await prepared.arrayBuffer()));
      return Response.json({ success: true, imageReceived: true });
    });
  }
});

test("reduces quality and dimensions until the upload fits", async () => {
  const oversized = new Blob([new Uint8Array(MAX_QUOTE_IMAGE_BYTES + 1)], { type: "image/jpeg" });
  const { browser, calls } = fakeBrowser([oversized, oversized, oversized, jpeg]);
  await prepareQuoteImage(largePhoto, browser);
  assert.deepEqual(calls.qualities, [0.85, 0.7, 0.55, 0.85]);
  assert.deepEqual(calls.sizes.at(-1), [1920, 1440]);
});

test("rejects unsupported and over-20-MB sources before decoding", async () => {
  await assert.rejects(prepareQuoteImage(new File(["svg"], "photo.svg", { type: "image/svg+xml" }), {}), /JPG, PNG or WebP/);
  await assert.rejects(prepareQuoteImage({ type: "image/jpeg", size: MAX_QUOTE_SOURCE_IMAGE_BYTES + 1 }, {}), /20 MB/);
});

test("decode and encoding failures report errors and release the preview URL", async () => {
  for (const [blobs, decodeFailure, message] of [
    [[jpeg], true, /could not be read/],
    [[null], false, /could not be resized/],
    [[new Blob([new Uint8Array(MAX_QUOTE_IMAGE_BYTES + 1)], { type: "image/jpeg" })], false, /still too large/],
  ]) {
    const { browser, calls } = fakeBrowser(blobs, decodeFailure);
    await assert.rejects(prepareQuoteImage(largePhoto, browser), message);
    assert.deepEqual(calls.revoked, ["blob:photo"]);
  }
});
