# Google click ID on quote enquiries

The shared `MovingQuoteLeadForm` adds the captured `clickIds.gclid` to `hubspotFormObject` as `hs_google_click_id` (HubSpot's existing Google Click ID contact property). This covers the homepage, dedicated quote page and four service landing pages. It uses the existing URL/cookie/localStorage capture, including navigation between pages; the stored value is not added as a visible field.

`utils/hubspotClickId.mjs` trims the ID and omits absent or malformed values. An enquiry without a click ID therefore does not send an empty property value that could clear an existing contact's attribution. This change only maps GCLID; GBRAID and WBRAID retain their existing Google Ads conversion path and are not substituted into the GCLID property.

The same HubSpot fields are forwarded with zero/one photo (secure forms submission API) and multiple photos (regional formsnext multipart protocol). Regression tests verify both transports, including the multipart `hs_context.fieldValues` copy.

The property's internal name was verified in the signed-in HubSpot property settings on 19 November 2026. Existing contacts already contain Google click IDs through HubSpot tracking; the website previously did not explicitly send the property. The private app cannot read property definitions (missing scope), so the browser was used for that read-only check. No new property or permission is needed for the code mapping. An attempted form-definition update was rejected by HubSpot's group-size validation; no live form settings were changed. A validation request using an invalid email returned HTTP 200, but no matching contact appeared in HubSpot; this does not establish an end-to-end saved-contact test. Verify a genuine new enquiry after deploying before relying on this mapping for offline-conversion reporting.

Validation: `node --test tests/*.test.mjs` and `npm run build`.
