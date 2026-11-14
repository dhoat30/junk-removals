import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sendAdminEmail, SubmissionError } from "./formSubmissions.mjs";
import { getEmailConfiguration, validEmail } from "./emailConfig.mjs";
import { enquiryEmailTemplate } from "./enquiryEmailTemplate.mjs";

export class EnquiryEmailError extends SubmissionError {
  constructor(receipt) {
    super("Your enquiry reached our team, but the confirmation email could not be sent. Please retry.", 502);
    this.adminEmailReceipt = receipt;
  }
}

async function fingerprint(payload, images) {
  const hash = createHash("sha256").update(JSON.stringify({ email: payload.email, message: payload.message, formName: payload.formName, fields: payload.hubspotFormObject || [] }));
  for (const image of images) hash.update(createHash("sha256").update(Buffer.from(await image.arrayBuffer())).digest());
  return hash.digest("hex");
}

const signature = (data, key) => createHmac("sha256", key).update(`enquiry-admin-delivery:${data}`).digest("base64url");
function validReceipt(receipt, digest, key) {
  if (typeof receipt !== "string" || receipt.length > 300) return false;
  const [data, signed, extra] = receipt.split(".");
  if (!data || !signed || extra !== undefined) return false;
  const expected = Buffer.from(signature(data, key));
  const actual = Buffer.from(signed);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  const [expiry, savedDigest] = Buffer.from(data, "base64url").toString().split(":");
  return Number(expiry) > Date.now() && savedDigest === digest;
}

export async function sendCustomerEnquiryEmail(payload, images, fetcher = fetch) {
  let configuration;
  try { configuration = getEmailConfiguration(); }
  catch (error) { throw new SubmissionError(error.message, 503); }
  if (!validEmail(payload.email)) throw new SubmissionError("Invalid email submission.");
  const { domain, apiKey, from, replyTo } = configuration;
  const template = enquiryEmailTemplate(payload, images.length, replyTo);
  const body = new FormData();
  for (const [name, value] of Object.entries({
    from, to: payload.email, subject: template.subject, text: template.text, html: template.html,
    "h:Reply-To": replyTo,
    "h:Auto-Submitted": "auto-replied", "h:X-Auto-Response-Suppress": "All",
    "o:tracking": "no", "o:tracking-opens": "no", "o:tracking-clicks": "no",
  })) body.append(name, value);
  const response = await fetcher(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST", headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` }, body,
  });
  if (!response.ok) throw new SubmissionError("The confirmation email could not be sent.", 502);
}

// A signed receipt lets the mounted form retry a failed confirmation without
// resending the already accepted admin notification, including across servers.
export async function sendEnquiryEmails(payload, images, fetcher = fetch) {
  let configuration;
  try { configuration = getEmailConfiguration(); }
  catch (error) { throw new SubmissionError(error.message, 503); }
  if (!validEmail(payload.email) || typeof payload.message !== "string" || typeof payload.formName !== "string" || /[\r\n]/.test(payload.formName) || (payload.hubspotFormObject !== undefined && !Array.isArray(payload.hubspotFormObject))) {
    throw new SubmissionError("Invalid email submission.");
  }
  const digest = await fingerprint(payload, images);
  let receipt = payload.adminEmailReceipt;
  if (!validReceipt(receipt, digest, configuration.apiKey)) {
    await sendAdminEmail(payload, images, fetcher);
    const data = Buffer.from(`${Date.now() + 24 * 60 * 60 * 1000}:${digest}`).toString("base64url");
    receipt = `${data}.${signature(data, configuration.apiKey)}`;
  }
  try {
    await sendCustomerEnquiryEmail(payload, images, fetcher);
  } catch {
    throw new EnquiryEmailError(receipt);
  }
  return { customerEmailSent: true };
}
