# Hero quote photos

Visitors can optionally add up to **10 photos** to a quote, either together or in successive selections. The form shows a selected count, a preview and remove control for each photo, and disables the picker at ten. A rejected batch preserves the previous selection and shows an error; visitors can retry, remove photos or explicitly keep their existing selection. Submission waits for preparation to finish.

Each source photo can be up to 20 MiB in JPG, PNG, WebP, HEIC or HEIF format. HEIC/HEIF is converted locally using the lazily loaded `heic-to/csp` decoder. Photos are processed sequentially to limit phone memory use. The **combined prepared upload stays at or below 3 MiB**, with an equal per-photo budget based on the selection count. Resizing starts at 2560 pixels, reducing quality and dimensions as needed (down to 640 pixels for a difficult ten-photo batch). Small supported photos pass through unchanged when they fit their budget.

Both endpoints accept repeated multipart `image` parts and validate the maximum count, combined size, individual MIME type, actual decoded format and pixel limits. The existing 4 MiB request guard remains in place. A declared `imageCount` must exactly match the received parts. Responses confirm the received count; the browser requires every photo to be confirmed by both destinations before recording conversions or redirecting.

- **HubSpot, multiple photos:** follows the published v4 form embed's file flow. The server checks the published render definition for `allowMultipleFiles`, uploads all prepared files under `0-1/junk_photo` to the submissions-files endpoint, and submits the confirmed upload GUID with the quote using the native formsnext multipart endpoint. It requires an explicit accepted receipt for the correct form; an HTTP 200 alone is insufficient. HubSpot keeps the photos in private form-upload storage. Multiple signed URLs are not joined into one file-field value.
- **HubSpot, one photo:** retains the verified PRIVATE Files API upload and signed URL import into `junk_photo`. The signed download is decoded and checked before form submission. Forms without a configured photo field keep the private file-reference fallback in `message`.
- **Admin email:** one Mailgun email includes every prepared photo as a separate multipart `attachment`, alongside the quote details and configured recipient. Both notifications use a verified business sender rather than the customer's address; the customer then receives a separate HTML confirmation. See [enquiry emails](enquiry-emails.md) for sender authentication and partial-delivery retries.
- **Retries:** each provider receives a fresh multipart request with the same prepared files. The mounted form skips a provider that already succeeded for an unchanged quote and photo selection. Changing fields or photos resets that retry state; a reload also resets it.

Existing forms can continue submitting JSON without photos, and legacy requests with one photo remain accepted.

The global render-definition endpoint returns the account's region in `x-origin-hublet`. File uploads and the final formsnext submission use that regional host (`forms-ap1.hsforms.com` for this account). Unlike the definition endpoint, the global upload endpoint rejects this account with HTTP 488 and `correctHublet: "ap1"`. If the region header is missing, the server permits one retry after that explicit wrong-region rejection, using only a validated HubSpot region. It does not retry an accepted upload or an ambiguous failure. `HUBSPOT_REGION` is an optional fallback; normal operation discovers the region automatically.

## HubSpot configuration

The private app behind `HUBSPOT_API_KEY` needs `files.write` to upload photos and `files.read` for file access (older apps may expose the combined `files` scope). These are separate from `forms-uploaded-files`. The website token was verified with `files.read`, `files.write`, `forms`, and `forms-uploaded-files` on 8 November 2026. No token rotation was needed. Photo uploads fail visibly rather than dropping the photo. Submissions without photos continue using the existing form API.

Existing variables are reused: `HUBSPOT_API_KEY`, `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`, `NEXT_PUBLIC_HUBSPOT_QUOTE_FORM_ID`, `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, and `EMAIL_ADDRESS`.

## Verification

Run `node --test tests/*.test.mjs` and `npm run build`. The automated checks use mocked browser decoding/canvas and providers, verify the resized file passes server validation for both destinations, and never send email or create live HubSpot contacts/files. Tests cover zero, one, two and ten photos, eleven-photo rejection, missing/corrupt parts, aggregate compression, partial receipts and provider failures. No live end-to-end quote was sent during this change; provider delivery tests use mocked responses.

The reported multi-photo upload error was reproduced against the live global endpoint: HTTP 488 identified `ap1` as the correct region. Uploading the same two generated JPEGs to the regional endpoint returned HTTP 202 and an upload GUID. The corrected helper was then exercised with ten generated JPEGs: the real definition and upload calls succeeded, and the final form POST was intercepted to verify it also targeted `ap1`. No contact, quote submission or email was created by these diagnostics. Regression tests cover `ap1`, `eu1` and default-region routing, plus bounded recovery when the region header is absent.

HEIC conversion was also checked in headless Chrome using libheif's `examples/example.heic`: the real decoder produced a 1280 × 854 JPEG (352,091 bytes), displayed a preview, and sent identical JPEG attachments to both intercepted quote endpoints. The resulting file passed the actual server image validator. A malformed HEIC displayed the conversion error. No live HubSpot submission or admin email was sent in this check.

HubSpot’s published v4 form was updated through the editor on 15 November 2026 to allow multiple files. The published v4 render definition confirms `allowMultipleFiles: true`. The older marketing v3 API still reports the legacy single-file setting and cannot update this v4 form, so it is not used to verify the current setting.

The local picker was verified to allow multiple selections. A new browser upload check was blocked by the Chrome extension’s local-file access setting; the earlier single HEIC conversion check below and the automated batch tests remain available.

References: [HubSpot v4 form embed implementation](https://static.hsappstatic.net/ui-forms-embed-components-app/static-1.7011/bundles/project.js), [HubSpot multiple file fields](https://knowledge.hubspot.com/forms/edit-form-fields#customize-the-file-upload-field), [HubSpot Files API](https://developers.hubspot.com/docs/api-reference/legacy/files/guide), [authenticated form file links](https://developers.hubspot.com/changelog/upcoming-forms-file-upload-access?hs_amp=true), [Mailgun attachments](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-attachments).

Development uses `.next-dev` while production builds use `.next`, so a verification build cannot overwrite a running local server.

A live Files API diagnostic succeeded with a tiny private `upload-diagnostic.png` (file ID `404565707229`). It is not attached to any contact. Cleanup returned 403 because the token lacks delete permission; the diagnostic file can be removed manually from HubSpot. No live contact submission or admin email was sent during this diagnostic.

On 8 November 2026, the existing broken form attachment `404577629664` was repaired in place using the original PNG in file `404577046008`. The authenticated download from the actual submission reference was verified to return the 2,572,856-byte PNG. No new contact submission or admin email was generated by this repair. A temporary backup of the old HTML was retained locally before replacement.

A live diagnostic showed that HubSpot rewrites PNG metadata (18 differing bytes in the tested upload) while preserving identical decoded pixels. Download verification therefore checks decoding, MIME type, format, and dimensions rather than file byte equality.
