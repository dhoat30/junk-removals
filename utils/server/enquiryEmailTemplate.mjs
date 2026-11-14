const siteUrl = "https://www.junkremovals.co.nz";
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function enquiryEmailTemplate(payload, imageCount, replyTo) {
  const fields = new Map((payload.hubspotFormObject || []).filter(field => typeof field?.value === "string").map(field => [field.name, field.value.trim()]));
  const firstName = (fields.get("firstname") || "").split(/\s+/)[0].slice(0, 80) || "there";
  const phone = (process.env.NEXT_PUBLIC_PHONE_NUMBER || "027 750 0081").trim();
  const phoneLink = phone.replace(/[^+\d]/g, "");
  const photoLine = imageCount ? `${imageCount} photo${imageCount === 1 ? "" : "s"} received` : "No photos attached";
  const details = [
    ["Enquiry", "Junk removal quote"],
    ...(fields.get("property_address") ? [["Property", fields.get("property_address").slice(0, 500)]] : []),
    ["Photos", photoLine],
  ];
  const text = `Hi ${firstName},\n\nThanks for getting in touch with Junk Removals. We've received your enquiry.\n\nOur team will review your details and get in touch to discuss the job and your quote.\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nNeed to add anything? Reply directly to this email. If you'd like to talk sooner, call ${phone}.\n\nThanks,\nThe Junk Removals team\n${replyTo}\n${siteUrl}\n\nYou're receiving this confirmation because an enquiry was submitted on our website using this email address.`;
  const rows = details.map(([label, value]) => `<tr><td style="padding:10px 12px 10px 0;vertical-align:top;width:100px;font-size:13px;color:#696969;">${escapeHtml(label)}</td><td style="padding:10px 0;font-size:14px;line-height:21px;color:#202020;word-break:break-word;">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>We've received your enquiry | Junk Removals</title>
<style>@media only screen and (max-width:600px){.outer{padding:16px 8px!important}.content{padding:28px 22px!important}.title{font-size:30px!important;line-height:36px!important}}</style></head>
<body style="margin:0;padding:0;background:#f5f3f1;font-family:Arial,Helvetica,sans-serif;color:#202020;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Thanks for getting in touch. Our team will review your enquiry and be in touch.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f3f1;"><tr><td class="outer" align="center" style="padding:40px 16px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e6e2de;border-radius:16px;overflow:hidden;">
<tr><td style="padding:25px 32px;background:#202020;border-bottom:5px solid #df0000;"><a href="${siteUrl}" style="font-size:24px;font-weight:900;font-style:italic;letter-spacing:-1px;text-decoration:none;color:#ffffff;">JUNK <span style="color:#ff5b52;">REMOVALS</span></a></td></tr>
<tr><td class="content" style="padding:36px 36px 32px;">
<p style="margin:0 0 14px;font-size:11px;line-height:18px;font-weight:bold;letter-spacing:2px;color:#b40000;">ENQUIRY RECEIVED</p>
<h1 class="title" style="margin:0 0 24px;font-size:36px;line-height:42px;font-weight:800;letter-spacing:-1px;">Thanks. We’ll take<br>it from here.</h1>
<p style="margin:0 0 14px;font-size:16px;line-height:26px;">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 14px;font-size:16px;line-height:26px;">Thanks for getting in touch with Junk Removals. <strong>We’ve received your enquiry.</strong></p>
<p style="margin:0 0 26px;font-size:16px;line-height:26px;color:#505050;">Our team will review your details and get in touch to discuss the job and your quote.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5f3;border-radius:10px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 6px;font-size:14px;font-weight:bold;">Your enquiry</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}</table></td></tr></table>
<h2 style="margin:28px 0 8px;font-size:18px;line-height:26px;">Need to add anything?</h2>
<p style="margin:0 0 22px;font-size:15px;line-height:25px;color:#505050;">Reply directly to this email and we’ll have your update. If you’d like to talk sooner, give us a call.</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#df0000" style="border-radius:8px;mso-padding-alt:14px 22px;"><a href="tel:${escapeHtml(phoneLink)}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;">Call ${escapeHtml(phone)}</a></td></tr></table>
<p style="margin:28px 0 0;font-size:15px;line-height:25px;">Thanks,<br><strong>The Junk Removals team</strong></p>
</td></tr>
<tr><td style="padding:22px 32px;background:#faf9f8;border-top:1px solid #eae6e2;"><p style="margin:0 0 10px;font-size:12px;line-height:20px;color:#555555;">Honest advice &nbsp;·&nbsp; Free quotes &nbsp;·&nbsp; No obligation</p><p style="margin:0;font-size:12px;line-height:20px;"><a href="mailto:${escapeHtml(replyTo)}" style="color:#a80000;text-decoration:underline;">${escapeHtml(replyTo)}</a><br><a href="${siteUrl}" style="color:#666666;text-decoration:underline;">junkremovals.co.nz</a></p></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="max-width:520px;margin:20px auto 0;padding:0 16px;font-size:11px;line-height:18px;color:#777777;">You’re receiving this confirmation because an enquiry was submitted on our website using this email address.</p>
</td></tr></table></body></html>`;
  return { subject: "We've received your enquiry | Junk Removals", text, html };
}
