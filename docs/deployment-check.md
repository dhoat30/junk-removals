# Pre-deployment check — 9 November 2026

Target: https://www.junkremovals.co.nz

## Corrected during the check

- Production domain defaults, homepage canonical/Open Graph URLs, robots.txt, and sitemap now use the Junk Removals domain.
- Homepage SEO title and description no longer inherit lawn-care content from the WordPress Yoast fields.
- Removed the broken Reviews navigation link; the sitemap now includes only the existing homepage.
- Footer now describes Auckland junk removal instead of Tauranga lawn mowing.
- Quote email/GTM labels use Junk Removal Quote.
- Removed placeholder `Example Company` consent and the forced marketing subscription from HubSpot requests. The live HubSpot form reports consent type `none`.
- Thank-you metadata no longer references the old moving-company domain and remains noindex.
- Added `.env.example` with production configuration names and no secrets.

## Passed

- Production build, lint/type checks run by the build, and all 20 photo/form tests.
- Rendered homepage has correct metadata, eight service cards, coverage section, and working quote/contact anchors.
- robots.txt and sitemap.xml respond successfully with the intended production domain.
- Logo, thank-you image, and favicon respond successfully. The inspected Apple touch icon uses Junk Removals branding.
- GTM container script loads and contains `quote_form_submission`. Conversion receipt in GA4/Google Ads is not proven by this source check.
- Prior real-user testing confirmed HubSpot photo delivery and admin email attachments; no new admin email/contact submission was sent during this audit.

## Dependency updates completed — 9 November 2026

Updated Next.js from 15.5.9 to 15.5.29, Sharp from 0.32.6 to 0.35.5, eslint-config-next to 15.5.29, and ESLint to the compatible 8.57.1 release. npm also updated affected packages within their existing ranges, including Axios to 1.21.0 and js-cookie to 3.0.8. Both package.json and package-lock.json must be committed.

Scoped overrides keep Next.js on the patched PostCSS release, TypeScript lint tooling on patched minimatch, Google API helper dependencies on patched uuid, and the proxy helper on patched basic-ftp. A global Sharp override ensures Next.js does not retain its older optional Sharp dependency. `npm ls sharp --all` confirms both resolve to 0.35.5.

Final npm audit: **0 critical, 0 high, 0 moderate, 1 low**. The remaining low advisory is `deepmerge` 4.3.1 through ReactPlayer. The registry's latest deepmerge release is still 4.3.1. No downgrade or ReactPlayer major migration was forced. This residual advisory is recorded; the project is not being represented as vulnerability-free.

The final production build and all 20 existing quote/photo tests pass. Existing Google API OAuth helper and video-player modules load with the updated dependencies. These checks use mocked form/email providers and do not create new leads or send admin email.

To repeat the checks:

```sh
npm audit --omit=dev
node --test tests/quote-photo.test.mjs
npm run build
```

`npm audit` currently exits nonzero for the remaining low finding. Deploy with the updated lockfile using `npm ci`; avoid `npm audit fix --force`, which proposed a Next.js 16 migration during remediation.

References:

- https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj
- https://github.com/advisories/GHSA-gcqx-w48m-w2h4

## Deployment configuration still to verify

The deployment host's environment has not been inspected. Configure the required variables listed in `.env.example`, particularly HubSpot, Mailgun, EMAIL_ADDRESS, GTM_ID, public phone/email, Maps key, and NEXT_PUBLIC_SITE_URL=https://www.junkremovals.co.nz. Public variables must be available when building. Match the package's Node 24 engine.

The local direct Google Ads conversion API credentials are absent, so that optional path skips uploads. GTM is configured independently. Verify the intended GTM conversion tags on the deployed domain.

Commit/include the new coverage section files and `.gitignore` when deploying from Git. Keep `.env` out of version control. After deployment, make one real submission with a photo and confirm HubSpot, admin email, and the GTM conversion event on the live domain. Check Google Maps key referrer restrictions include the live domain.
