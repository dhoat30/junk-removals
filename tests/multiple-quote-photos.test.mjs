import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { MAX_QUOTE_IMAGES_BYTES } from '../utils/quoteImage.mjs';
import { prepareQuoteImages } from '../utils/prepareQuoteImage.mjs';
import { submitQuote } from '../utils/submitQuote.mjs';
import { readSubmission, sendAdminEmail, sendHubspotSubmission } from '../utils/server/formSubmissions.mjs';

const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: 'red' } }).png().toBuffer();
const photos = Array.from({ length: 10 }, (_, i) => new File([png], `photo-${i + 1}.png`, { type: 'image/png' }));
const payload = {
  portalID: '123456', hubspotFormID: '12345678-abcd-1234-abcd-123456789abc',
  email: 'customer@example.com', formName: 'Test quote', message: 'Items for removal',
  hubspotFileField: 'junk_photo', hubspotFormObject: [{ name: 'email', value: 'customer@example.com' }, { name: 'phone', value: '0271234567' }],
};
const request = (images, count = images.length) => {
  const body = new FormData();
  body.append('payload', JSON.stringify({ ...payload, hasImage: count > 0, imageCount: count }));
  for (const image of images) body.append('image', image);
  return new Request('https://example.com/api/sendmail', { method: 'POST', body });
};

test('zero, one, two and ten photos survive browser transport and server validation for both destinations', async () => {
  for (const count of [0, 1, 2, 10]) {
    for (const endpoint of ['/api/sendmail', '/api/submit-hubspot-form']) {
      await submitQuote(endpoint, payload, photos.slice(0, count), async (url, options) => {
        const result = await readSubmission(new Request(`https://example.com${url}`, options));
        assert.equal(result.images.length, count);
        assert.equal(result.payload.imageCount, count);
        for (const image of result.images) assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
        assert.equal(new Set(result.images.map(image => image.name)).size, count);
        return Response.json({ success: true, imageReceived: count > 0, imageCount: count });
      });
    }
  }
});

test('server rejects excess photos, a missing photo, a corrupt later photo and oversized combined uploads', async () => {
  await assert.rejects(readSubmission(request([...photos, photos[0]])), /up to 10 photos/);
  await assert.rejects(readSubmission(request(photos.slice(0, 9), 10)), /Not all selected photos/);
  await assert.rejects(readSubmission(request([photos[0], new File(['broken'], 'broken.png', { type: 'image/png' })])), /could not be read/);
  const large = new File([new Uint8Array(MAX_QUOTE_IMAGES_BYTES / 2 + 1)], 'large.png', { type: 'image/png' });
  await assert.rejects(readSubmission(request([large, large])), /too large together/);
});

test('partial or absent receipt counts never report successful multi-photo delivery', async () => {
  for (const count of [undefined, 1, 9, 11]) {
    await assert.rejects(submitQuote('/api/sendmail', payload, photos, async () => Response.json({ success: true, imageReceived: true, imageCount: count })), /Not all your photos/);
  }
});

test('Mailgun receives all ten attachments in one admin email', async () => {
  process.env.MAILGUN_DOMAIN = 'mg.example.com';
  process.env.MAILGUN_API_KEY = 'fake-token';
  process.env.EMAIL_ADDRESS = 'admin@example.com';
  let calls = 0;
  await sendAdminEmail(payload, photos, async (url, options) => {
    calls++;
    assert.match(url, /mailgun/);
    const attachments = options.body.getAll('attachment');
    assert.deepEqual(attachments.map(file => file.name), photos.map(file => file.name));
    for (const image of attachments) assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
    assert.match(options.body.get('text'), /10 photos of the items are attached/);
    return new Response('{}');
  });
  assert.equal(calls, 1);
});

const uploadGuid = '12345678-1234-1234-1234-123456789abc';
const definition = { form: { lastUpdatedAt: 12345, modules: [{ type: 'step', modules: [{ type: 'file', propertyReference: '0-1/junk_photo', allowMultipleFiles: true }] }] }, settings: { locale: 'EN' } };

test('HubSpot receives ten files together and submits their confirmed upload GUID with the quote', async () => {
  process.env.HUBSPOT_API_KEY = 'fake-token';
  for (const html of [false, true]) {
    let calls = 0;
    await sendHubspotSubmission(payload, photos, async (url, options) => {
      calls++;
      if (calls === 1) {
        assert.match(url, /embed\/v4\/render-definition/);
        return Response.json(definition);
      }
      assert.equal(options.headers, undefined);
      if (calls === 2) {
        assert.match(url, /submissions-files\/v1\/upload\/files/);
        const attachments = options.body.getAll('0-1/junk_photo');
        assert.equal(attachments.length, 10);
        for (const image of attachments) assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
        return Response.json({ uploadGuid }, { status: 202 });
      }
      assert.match(url, /submissions\/v3\/public\/submit\/formsnext\/multipart/);
      assert.equal(options.body.get('0-1/email'), payload.email);
      assert.equal(options.body.get('0-1/phone'), '0271234567');
      assert.equal(options.body.get('0-1/junk_photo'), uploadGuid);
      const context = JSON.parse(options.body.get('hs_context'));
      assert.equal(context.fieldValues['0-1/junk_photo'], uploadGuid);
      assert.equal(context.formDefinitionUpdatedAt, 12345);
      const result = { accepted: true, formGuid: payload.hubspotFormID };
      return html ? new Response(`<html><script>window.parent.postMessage(${JSON.stringify(result)}, '*');</script></html>`) : Response.json(result);
    });
    assert.equal(calls, 3);
  }
});

test('HubSpot stops on configuration, upload and form rejection instead of confirming partial delivery', async () => {
  process.env.HUBSPOT_API_KEY = 'fake-token';
  for (const failure of ['definition', 'single', 'upload', 'guid', 'submit', 'rejected', 'unconfirmed']) {
    let calls = 0;
    await assert.rejects(sendHubspotSubmission(payload, photos, async () => {
      calls++;
      if (calls === 1) {
        if (failure === 'definition') return new Response('failed', { status: 502 });
        if (failure === 'single') return Response.json({ form: { modules: [] } });
        return Response.json(definition);
      }
      if (calls === 2) {
        if (failure === 'upload') return new Response('failed', { status: 502 });
        return Response.json({ uploadGuid: failure === 'guid' ? 'bad' : uploadGuid }, { status: 202 });
      }
      if (failure === 'submit') return new Response('failed', { status: 502 });
      if (failure === 'unconfirmed') return new Response('<html>not a receipt</html>');
      return Response.json({ accepted: false, formGuid: payload.hubspotFormID });
    }), /HubSpot/);
    assert.equal(calls, ['definition', 'single'].includes(failure) ? 1 : ['upload', 'guid'].includes(failure) ? 2 : 3);
  }
});

test('batch preparation validates all files before conversion and rejects eleven photos', async () => {
  assert.deepEqual(await prepareQuoteImages([], {}), []);
  assert.deepEqual(await prepareQuoteImages(photos, {}), photos);
  await assert.rejects(prepareQuoteImages([...photos, photos[0]], {}), /up to 10 photos/);
  const heic = new File(['heic'], 'phone.heic', { type: 'image/heic' });
  const invalid = new File(['svg'], 'bad.svg', { type: 'image/svg+xml' });
  await assert.rejects(prepareQuoteImages([heic, invalid], {}, () => assert.fail('must validate before converting')), /bad.svg/);
});

test('ten larger photos are recompressed to the combined request budget sequentially', async () => {
  const input = Array.from({ length: 10 }, (_, i) => new File([new Uint8Array(400000)], `large-${i}.png`, { type: 'image/png' }));
  const jpeg = await sharp(png).jpeg().toBuffer();
  let active = 0;
  let encodes = 0;
  const browser = {
    File, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    Image: class {
      naturalWidth = 4000; naturalHeight = 3000;
      set src(value) { assert.equal(active++, 0); queueMicrotask(() => this.onload()); }
    },
    document: { createElement: () => ({
      getContext: () => ({ fillRect() {}, drawImage() {} }),
      toBlob(callback) { active--; encodes++; callback(new Blob([jpeg], { type: 'image/jpeg' })); },
    }) },
  };
  const result = await prepareQuoteImages(input, browser);
  assert.equal(encodes, 10);
  assert.equal(result.length, 10);
  assert.ok(result.every(image => image.type === 'image/jpeg'));
  assert.ok(result.reduce((sum, image) => sum + image.size, 0) <= MAX_QUOTE_IMAGES_BYTES);
});
