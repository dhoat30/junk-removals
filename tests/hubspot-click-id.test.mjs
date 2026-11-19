import test from 'node:test';
import assert from 'node:assert/strict';
import { hubspotClickIdFields } from '../utils/hubspotClickId.mjs';
import { sendHubspotSubmission } from '../utils/server/formSubmissions.mjs';

test('Google click IDs use the existing HubSpot contact property', () => {
  assert.deepEqual(hubspotClickIdFields({ gclid: ' Cj0_test-click.id~123 ' }), [{ name: 'hs_google_click_id', value: 'Cj0_test-click.id~123' }]);
});

test('missing or invalid click IDs never clear an existing HubSpot value', () => {
  for (const gclid of [undefined, null, '', '  ', 123, {}, 'bad\nvalue', '<script>', 'x'.repeat(513)]) {
    assert.deepEqual(hubspotClickIdFields({ gclid }), []);
  }
  assert.deepEqual(hubspotClickIdFields(), []);
});

test('HubSpot form submission forwards the captured click ID', async () => {
  process.env.HUBSPOT_API_KEY = 'fake-token';
  const payload = { portalID: '12345', hubspotFormID: '12345678-1234-1234-1234-123456789abc', hubspotFormObject: [{ name: 'email', value: 'test@example.com' }, ...hubspotClickIdFields({ gclid: 'test-gclid' })] };
  let calls = 0;
  await sendHubspotSubmission(payload, [], async (url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body).fields.find(f => f.name === 'hs_google_click_id'), { name: 'hs_google_click_id', value: 'test-gclid' });
    return Response.json({ inlineMessage: 'OK' });
  });
  assert.equal(calls, 1);
});
