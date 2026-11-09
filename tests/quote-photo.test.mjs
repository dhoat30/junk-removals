import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readSubmission, sendHubspotSubmission, sendAdminEmail } from "../utils/server/formSubmissions.mjs";
import { submitQuote } from "../utils/submitQuote.mjs";
import { MAX_QUOTE_IMAGE_BYTES, quoteImageError } from "../utils/quoteImage.mjs";

const payload = {
  portalID: "123456",
  hubspotFormID: "12345678-abcd-1234-abcd-123456789abc",
  email: "customer@example.com",
  formName: "Junk removal quote",
  message: "Service Needed: Furniture removal",
  hubspotFormObject: [{ name: "firstname", value: "Test" }, { name: "email", value: "customer@example.com" }, { name: "message", value: "Service Needed: Furniture removal" }],
};
const photo = new File([await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer()], "items.png", { type: "image/png" });
const ok = (data = {}) => new Response(JSON.stringify(data), { status: 200 });
const multipartRequest = (file = photo) => {
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  if (file) body.append("image", file);
  return new Request("https://example.com/api/submit-hubspot-form", { method: "POST", body });
};

beforeEach(() => {
  process.env.HUBSPOT_API_KEY = "test-token";
  process.env.MAILGUN_DOMAIN = "mg.example.com";
  process.env.MAILGUN_API_KEY = "test-mail-token";
  process.env.EMAIL_ADDRESS = "admin@example.com";
});

test("existing JSON forms still work without an image", async () => {
  const request = new Request("https://example.com/api/sendmail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await readSubmission(request);
  assert.deepEqual(result.payload, payload);
  assert.equal(result.image, null);
});

test("valid multipart photo is decoded and given a safe filename", async () => {
  const result = await readSubmission(multipartRequest());
  assert.equal(result.image.type, "image/png");
  assert.match(result.image.name, /^quote-photo-[a-f\d-]+\.png$/);
  assert.deepEqual(Buffer.from(await result.image.arrayBuffer()), Buffer.from(await photo.arrayBuffer()));
  assert.deepEqual(result.payload, payload);
});

test("optional photo can be omitted from multipart submission", async () => {
  assert.equal((await readSubmission(multipartRequest(null))).image, null);
});

test("rejects oversized, empty, and unsupported selections", async () => {
  assert.match(quoteImageError({ type: "image/png", size: MAX_QUOTE_IMAGE_BYTES + 1 }), /3 MB/);
  await assert.rejects(readSubmission(multipartRequest(new File([], "empty.png", { type: "image/png" }))), /empty/);
  await assert.rejects(readSubmission(multipartRequest(new File(["svg"], "bad.svg", { type: "image/svg+xml" }))), /JPG, PNG or WebP/);
});

test("rejects corrupt files and images with a spoofed MIME type", async () => {
  await assert.rejects(readSubmission(multipartRequest(new File(["not an image"], "fake.png", { type: "image/png" }))), /could not be read/);
  await assert.rejects(readSubmission(multipartRequest(new File([await photo.arrayBuffer()], "fake.jpg", { type: "image/jpeg" }))), /could not be read/);
});

test("rejects malformed payloads and multiple image uploads", async () => {
  await assert.rejects(readSubmission(new Request("https://example.com", { method: "POST", body: "bad json" })), /Invalid form/);
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  body.append("image", photo); body.append("image", photo);
  await assert.rejects(readSubmission(new Request("https://example.com", { method: "POST", body })), /one image/);
});

test("HubSpot receives a PRIVATE upload and photo reference with all existing fields", async () => {
  const requests = [];
  await sendHubspotSubmission(payload, photo, async (url, options) => {
    requests.push({ url, ...options });
    return requests.length === 1 ? ok({ id: "998877" }) : ok();
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.get("file").name, "items.png");
  assert.equal(JSON.parse(requests[0].body.get("options")).access, "PRIVATE");
  const submitted = JSON.parse(requests[1].body);
  assert.equal(submitted.fields.find(f => f.name === "firstname").value, "Test");
  assert.match(submitted.fields.find(f => f.name === "message").value, /998877\/signed-url-redirect\?portalId=123456/);
  assert.match(submitted.fields.find(f => f.name === "message").value, /Service Needed: Furniture removal/);
  assert.equal(payload.hubspotFormObject.at(-1).value, "Service Needed: Furniture removal");
});

test("no photo skips the HubSpot Files API", async () => {
  let calls = 0;
  await sendHubspotSubmission(payload, null, async (url, options) => {
    calls++;
    assert.match(url, /secure\/submit/);
    assert.deepEqual(JSON.parse(options.body).fields, payload.hubspotFormObject);
    return ok();
  });
  assert.equal(calls, 1);
});

test("failed photo upload does not silently submit without the photo", async () => {
  let calls = 0;
  await assert.rejects(sendHubspotSubmission(payload, photo, async () => { calls++; return new Response("denied", { status: 403 }); }), /photo could not be saved/);
  assert.equal(calls, 1);
});

test("admin email includes the exact image bytes as a multipart attachment", async () => {
  await sendAdminEmail(payload, photo, async (url, options) => {
    assert.equal(options.body.get("to"), "admin@example.com");
    assert.equal(options.body.get("subject"), payload.formName);
    assert.match(options.body.get("text"), /photo of the items is attached/);
    assert.equal(options.headers["Content-Type"], undefined);
    assert.deepEqual(Buffer.from(await options.body.get("attachment").arrayBuffer()), Buffer.from(await photo.arrayBuffer()));
    return ok();
  });
});

test("admin email without photo has no attachment and retains the message", async () => {
  await sendAdminEmail(payload, null, async (url, options) => {
    assert.equal(options.body.get("attachment"), null);
    assert.equal(options.body.get("text"), payload.message);
    return ok();
  });
});

test("provider failures are reported instead of returning success", async () => {
  await assert.rejects(sendAdminEmail(payload, photo, async () => new Response("failed", { status: 500 })), /admin email could not/);
  await assert.rejects(sendHubspotSubmission(payload, null, async () => new Response("failed", { status: 400 })), /HubSpot submission failed/);
});


test("hero file field uses a verified signed image URL rather than a login redirect", async () => {
  const heroPayload = {
    ...payload,
    hubspotFileField: "junk_photo",
    hubspotFormObject: [
      { name: "firstname", value: "Test" },
      { name: "email", value: payload.email },
      { name: "phone", value: "" },
      { name: "property_address", value: "123 Test Street" },
    ],
  };
  let calls = 0;
  const signedUrl = "https://example.hubspotusercontent.com/quote.png?signature=test";
  await sendHubspotSubmission(heroPayload, photo, async (url, options) => {
    calls++;
    if (calls === 1) return ok({ id: "112233" });
    if (calls === 2) { assert.match(url, /112233\/signed-url$/); return ok({ url: signedUrl }); }
    if (calls === 3) {
      assert.equal(url, signedUrl);
      assert.equal(options.headers, undefined);
      assert.equal(options.redirect, "error");
      return new Response(await photo.arrayBuffer(), { headers: { "Content-Type": "image/png" } });
    }
    const fields = JSON.parse(options.body).fields;
    assert.deepEqual(fields.map(f => f.name), ["firstname", "email", "phone", "property_address", "junk_photo"]);
    assert.equal(fields.find(f => f.name === "property_address").value, "123 Test Street");
    assert.equal(fields.find(f => f.name === "junk_photo").value, signedUrl);
    return ok();
  });
  assert.equal(calls, 4);
});

test("login HTML or mismatched image data is rejected before HubSpot imports it", async () => {
  for (const content of [new Response("<html>HubSpot Login</html>", { headers: { "Content-Type": "text/html" } }), new Response("wrong bytes", { headers: { "Content-Type": "image/png" } })]) {
    let calls = 0;
    await assert.rejects(sendHubspotSubmission({ ...payload, hubspotFileField: "junk_photo" }, photo, async () => {
      calls++;
      if (calls === 1) return ok({ id: "112233" });
      if (calls === 2) return ok({ url: "https://example.hubspotusercontent.com/quote.png?signature=test" });
      return content;
    }), /photo could not be attached/);
    assert.equal(calls, 3);
  }
});

test("signing failures do not fall back to a broken authenticated redirect", async () => {
  let calls = 0;
  await assert.rejects(sendHubspotSubmission({ ...payload, hubspotFileField: "junk_photo" }, photo, async () => {
    calls++;
    return calls === 1 ? ok({ id: "112233" }) : new Response("denied", { status: 403 });
  }), /could not prepare/);
  assert.equal(calls, 2);
});


test("selected-photo requests cannot be silently accepted without their image", async () => {
  const body = new FormData();
  body.append("payload", JSON.stringify({ ...payload, hasImage: true }));
  await assert.rejects(readSubmission(new Request("https://example.com", { method: "POST", body })), /selected photo was missing/);
});

test("browser transport sends the selected photo intact to both API endpoints", async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    const request = new Request(`https://example.com${url}`, options);
    assert.match(request.headers.get("Content-Type"), /multipart\/form-data; boundary=/);
    const submission = await readSubmission(request);
    requests.push({ url, submission });
    assert.equal(submission.payload.hasImage, true);
    assert.deepEqual(Buffer.from(await submission.image.arrayBuffer()), Buffer.from(await photo.arrayBuffer()));
    return ok({ success: true, imageReceived: true });
  };
  await Promise.all([
    submitQuote("/api/submit-hubspot-form", payload, photo, fakeFetch),
    submitQuote("/api/sendmail", payload, photo, fakeFetch),
  ]);
  assert.equal(requests.length, 2);
});

test("browser transport requires image confirmation before treating the request as successful", async () => {
  await assert.rejects(submitQuote("/api/sendmail", payload, photo, async () => ok({ success: true })), /photo was not confirmed/);
});

test("browser transport still supports quotes without a photo and surfaces provider errors", async () => {
  await submitQuote("/api/sendmail", payload, null, async (url, options) => {
    assert.equal(options.body.get("image"), null);
    return ok({ success: true, imageReceived: false });
  });
  await assert.rejects(submitQuote("/api/sendmail", payload, photo, async () => new Response(JSON.stringify({ message: "Upload unavailable" }), { status: 502 })), /Upload unavailable/);
});


test("HubSpot metadata changes do not reject an otherwise valid photo", async () => {
  const rewritten = await sharp(await photo.arrayBuffer()).withMetadata({ density: 144 }).png().toBuffer();
  assert.equal(rewritten.equals(Buffer.from(await photo.arrayBuffer())), false);
  assert.deepEqual(await sharp(rewritten).raw().toBuffer(), await sharp(await photo.arrayBuffer()).raw().toBuffer());
  let calls = 0;
  await sendHubspotSubmission({ ...payload, hubspotFileField: "junk_photo" }, photo, async () => {
    calls++;
    if (calls === 1) return ok({ id: "112233" });
    if (calls === 2) return ok({ url: "https://example.hubspotusercontent.com/quote.png?signature=test" });
    if (calls === 3) return new Response(rewritten, { headers: { "Content-Type": "image/png" } });
    return ok();
  });
  assert.equal(calls, 4);
});
