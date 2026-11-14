export function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]+$/.test(value) && !/[\r\n]/.test(value);
}

export function getEmailConfiguration() {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const recipient = process.env.EMAIL_ADDRESS;
  if (!domain || !/^[a-z\d.-]+\.[a-z]{2,}$/i.test(domain) || !apiKey || !validEmail(recipient)) {
    throw new Error("Missing email configuration.");
  }
  const sender = process.env.MAILGUN_FROM_EMAIL || `enquiries@${domain}`;
  const replyTo = process.env.MAILGUN_REPLY_TO || recipient;
  if (!validEmail(sender) || sender.split("@")[1].toLowerCase() !== domain.toLowerCase() || !validEmail(replyTo)) {
    throw new Error("The enquiry email sender must use the verified Mailgun domain.");
  }
  return { domain, apiKey, recipient, from: `Junk Removals <${sender}>`, replyTo };
}
