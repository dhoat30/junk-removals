# Hero quote photos

The existing hero form fields remain unchanged. A visitor can optionally add one JPG, PNG, WebP, HEIC or HEIF image up to 20 MiB, preview it, change it, or remove it. HEIC/HEIF photos are converted to JPEG locally using a lazily loaded `heic-to/csp` decoder, then resized before upload. Other photos over 3 MiB are also resized in the browser to a JPEG no larger than 3 MiB before submission. Resizing starts at a maximum dimension of 2560 pixels and reduces quality and dimensions if needed; smaller JPG, PNG and WebP files pass through unchanged. The submit button waits for photo preparation to finish. Both APIs retain the 3 MiB upload limit and accept only JPG, PNG and WebP, validating the file size, declared type, actual image format, decoding, and pixel limit before forwarding it. Conversion failures appear beside the picker and block submission until the visitor selects a valid photo; an HEIC file is never silently omitted or forwarded unchanged.

The hero submits multipart form data containing `payload` (the existing JSON) and optional `image`. Existing forms can continue submitting JSON to the same endpoints.

- HubSpot: uploads the image to `/quote-photos` using the Files API with `PRIVATE` access. The hero maps its address to `property_address` and a verified signed image URL to the new `junk_photo` file field. Only fields present on the current HubSpot form are submitted; quote details still appear in the admin email. Other forms without a configured file field retain the `message` reference fallback. The signed source URL lets HubSpot import the photo bytes into its private form-upload storage. Before submission, the server downloads the signed URL without bearer credentials and checks the MIME type, decoded format, dimensions, and successful image decoding; metadata rewrites by HubSpot are allowed. Staff sign into HubSpot to view the resulting form attachment. Never pass a login-required redirect URL to a form file field: HubSpot imports the login HTML as a file.
- Admin email: Mailgun receives the image as a multipart `attachment`, alongside the existing quote details and recipient (`EMAIL_ADDRESS`).
- The form uses a fresh multipart request per provider with the prepared photo held in state, rather than the oversized original in the file input. Requests declare whether a photo is expected; both endpoints reject a missing expected photo and explicitly confirm image receipt. The page redirects and records conversions only when both providers succeed and confirm the photo. An unchanged request retried in the same mounted form skips a provider that has already succeeded. Reloading the page resets this retry state.

## HubSpot configuration

The private app behind `HUBSPOT_API_KEY` needs `files.write` to upload photos and `files.read` for file access (older apps may expose the combined `files` scope). These are separate from `forms-uploaded-files`. The website token was verified with `files.read`, `files.write`, `forms`, and `forms-uploaded-files` on 8 November 2026. No token rotation was needed. Photo uploads fail visibly rather than dropping the photo. Submissions without photos continue using the existing form API.

Existing variables are reused: `HUBSPOT_API_KEY`, `NEXT_PUBLIC_HUBSPOT_PORTAL_ID`, `NEXT_PUBLIC_HUBSPOT_QUOTE_FORM_ID`, `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, and `EMAIL_ADDRESS`.

## Verification

Run `node --test tests/*.test.mjs` and `npm run build`. The automated checks use mocked browser decoding/canvas and providers, verify the resized file passes server validation for both destinations, and never send email or create live HubSpot contacts/files. The token permissions have been verified. Submit a real quote to verify delivery to both destinations with your account; a live end-to-end submission has not been sent during automated testing.

HEIC conversion was also checked in headless Chrome using libheif's `examples/example.heic`: the real decoder produced a 1280 × 854 JPEG (352,091 bytes), displayed a preview, and sent identical JPEG attachments to both intercepted quote endpoints. The resulting file passed the actual server image validator. A malformed HEIC displayed the conversion error. No live HubSpot submission or admin email was sent in this check.

References: [HubSpot Files API](https://developers.hubspot.com/docs/api-reference/legacy/files/guide), [authenticated form file links](https://developers.hubspot.com/changelog/upcoming-forms-file-upload-access?hs_amp=true), [Mailgun attachments](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-attachments).

Development uses `.next-dev` while production builds use `.next`, so a verification build cannot overwrite a running local server.

A live Files API diagnostic succeeded with a tiny private `upload-diagnostic.png` (file ID `404565707229`). It is not attached to any contact. Cleanup returned 403 because the token lacks delete permission; the diagnostic file can be removed manually from HubSpot. No live contact submission or admin email was sent during this diagnostic.

On 8 November 2026, the existing broken form attachment `404577629664` was repaired in place using the original PNG in file `404577046008`. The authenticated download from the actual submission reference was verified to return the 2,572,856-byte PNG. No new contact submission or admin email was generated by this repair. A temporary backup of the old HTML was retained locally before replacement.

A live diagnostic showed that HubSpot rewrites PNG metadata (18 differing bytes in the tested upload) while preserving identical decoded pixels. Download verification therefore checks decoding, MIME type, format, and dimensions rather than file byte equality.
