import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sendAdminEmail } from '../utils/server/formSubmissions.mjs';
import { enquiryEmailTemplate } from '../utils/server/enquiryEmailTemplate.mjs';
import { sendEnquiryEmails, EnquiryEmailError } from '../utils/server/enquiryEmails.mjs';
import { submitQuote } from '../utils/submitQuote.mjs';

const payload = {
  email: 'customer@example.com', formName: 'Junk removal quote', message: 'First Name: Alice\nService Needed: Furniture removal',
  hubspotFormObject: [{ name: 'firstname', value: 'Alice Smith' }, { name: 'property_address', value: 'Auckland' }],
};
const image = new File(['photo bytes'], 'items.jpg', { type: 'image/jpeg' });
const accepted = () => Response.json({ id: 'test-message-id', message: 'Queued. Thank you.' });

beforeEach(() => {
  process.env.MAILGUN_DOMAIN = 'mail.junkremovals.co.nz';
  process.env.MAILGUN_API_KEY = 'test-mailgun-key';
  process.env.EMAIL_ADDRESS = 'info@junkremovals.co.nz';
  delete process.env.MAILGUN_FROM_EMAIL;
  delete process.env.MAILGUN_REPLY_TO;
});

test('admin notification uses the authenticated business sender with customer Reply-To', async () => {
  await sendAdminEmail(payload, [image], async (url, options) => {
    assert.equal(options.body.get('from'), 'Junk Removals <enquiries@mail.junkremovals.co.nz>');
    assert.equal(options.body.get('h:Reply-To'), payload.email);
    assert.equal(options.body.get('to'), 'info@junkremovals.co.nz');
    assert.equal(options.body.getAll('attachment').length, 1);
    return accepted();
  });
});

test('successful enquiry queues a separate HTML and plain-text customer confirmation after admin acceptance', async () => {
  const requests = [];
  const result = await sendEnquiryEmails(payload, [image], async (url, options) => {
    requests.push(options.body);
    if (requests.length === 1) assert.equal(options.body.get('to'), 'info@junkremovals.co.nz');
    else {
      assert.equal(options.body.get('to'), payload.email);
      assert.equal(options.body.get('h:Reply-To'), 'info@junkremovals.co.nz');
      assert.equal(options.body.get('from'), 'Junk Removals <enquiries@mail.junkremovals.co.nz>');
      assert.match(options.body.get('html'), /Hi Alice,/);
      assert.match(options.body.get('html'), /1 photo received/);
      assert.match(options.body.get('text'), /received your enquiry/);
      assert.equal(options.body.get('attachment'), null);
      assert.equal(options.body.get('h:Auto-Submitted'), 'auto-replied');
      assert.equal(options.body.get('o:tracking'), 'no');
    }
    return accepted();
  });
  assert.equal(requests.length, 2);
  assert.deepEqual(result, { customerEmailSent: true });
});

async function failedConfirmation() {
  let calls = 0;
  try {
    await sendEnquiryEmails(payload, [image], async () => ++calls === 1 ? accepted() : new Response('failed', { status: 502 }));
    assert.fail('must report failed confirmation');
  } catch (error) {
    assert.ok(error instanceof EnquiryEmailError);
    assert.equal(calls, 2);
    assert.equal(error.status, 502);
    assert.match(error.message, /enquiry reached our team/);
    assert.ok(error.adminEmailReceipt);
    return error.adminEmailReceipt;
  }
}

test('confirmation failure can be retried without sending the admin email again', async () => {
  const adminEmailReceipt = await failedConfirmation();
  let calls = 0;
  await sendEnquiryEmails({ ...payload, adminEmailReceipt }, [image], async (url, options) => {
    calls++;
    assert.equal(options.body.get('to'), payload.email);
    return accepted();
  });
  assert.equal(calls, 1);
});

test('tampered receipts and changed quotes cannot bypass admin delivery', async () => {
  const receipt = await failedConfirmation();
  for (const [data, images] of [
    [{ ...payload, adminEmailReceipt: `${receipt}tampered` }, [image]],
    [{ ...payload, email: 'different@example.com', adminEmailReceipt: receipt }, [image]],
    [{ ...payload, message: 'Changed details', adminEmailReceipt: receipt }, [image]],
    [{ ...payload, adminEmailReceipt: receipt }, []],
    [{ ...payload, adminEmailReceipt: receipt }, [new File(['different bytes'], 'items.jpg', { type: 'image/jpeg' })]],
  ]) {
    const recipients = [];
    await sendEnquiryEmails(data, images, async (url, options) => { recipients.push(options.body.get('to')); return accepted(); });
    assert.deepEqual(recipients, ['info@junkremovals.co.nz', data.email]);
  }
});

test('expired receipts cannot bypass admin delivery', async () => {
  const receipt = await failedConfirmation();
  const originalNow = Date.now;
  let calls = 0;
  try {
    const afterExpiry = originalNow() + 24 * 60 * 60 * 1000 + 1000;
    Date.now = () => afterExpiry;
    await sendEnquiryEmails({ ...payload, adminEmailReceipt: receipt }, [image], async () => { calls++; return accepted(); });
  } finally { Date.now = originalNow; }
  assert.equal(calls, 2);
});

test('failed admin delivery never sends a customer acknowledgement', async () => {
  let calls = 0;
  await assert.rejects(sendEnquiryEmails(payload, [], async () => { calls++; return new Response('failed', { status: 502 }); }), /admin email could not/);
  assert.equal(calls, 1);
});

test('invalid addresses and header injection are rejected before sending email', async () => {
  for (const data of [{ ...payload, email: 'bad\r\nBcc: victim@example.com' }, { ...payload, email: 'first@example.com,second@example.com' }, { ...payload, formName: 'Quote\nBcc: victim@example.com' }]) {
    await assert.rejects(sendEnquiryEmails(data, [], () => assert.fail('must not send')), /Invalid email submission/);
  }
  process.env.MAILGUN_FROM_EMAIL = 'customer@gmail.com';
  await assert.rejects(sendEnquiryEmails(payload, [], () => assert.fail('must not send')), /verified Mailgun domain/);
});

test('customer template escapes supplied details and never echoes arbitrary enquiry messages', () => {
  const result = enquiryEmailTemplate({ ...payload, message: '<script>alert(1)</script>', hubspotFormObject: [{ name: 'firstname', value: '<Alice&>' }, { name: 'property_address', value: '<script>alert(2)</script>' }] }, 10, 'info@junkremovals.co.nz');
  assert.match(result.html, /Hi &lt;Alice&amp;&gt;,/);
  assert.match(result.html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
  assert.doesNotMatch(result.html, /<script>|alert\(1\)/);
  assert.match(result.html, /10 photos received/);
  assert.match(result.html, /tel:0277500081/);
  assert.doesNotMatch(result.html, /https?:\/\/customer/);
  const empty = enquiryEmailTemplate({ email: payload.email }, 0, 'info@junkremovals.co.nz');
  assert.match(empty.html, /Hi there,/);
  assert.match(empty.text, /No photos attached/);
});

test('browser transport preserves the signed admin delivery receipt for a retry', async () => {
  const receipt = await failedConfirmation();
  try {
    await submitQuote('/api/sendmail', payload, [], async () => Response.json({ success: false, message: 'Please retry', adminEmailReceipt: receipt }, { status: 502 }));
    assert.fail('must report failed confirmation');
  } catch (error) { assert.equal(error.adminEmailReceipt, receipt); }
});
