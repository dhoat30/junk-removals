# Google Search landing pages

Four statically generated landing pages extend the existing Next.js website. The homepage stays available at `/`. All pages share the existing header, hero, `MovingQuoteLeadForm`, service cards, process, coverage, FAQ and footer components. A reusable `ServiceInformationSection` adds collection guidance and pricing explanations using the existing red, charcoal and neutral design tokens.

## Ad-group mapping

Use these paths as the ad final URLs after deploying the website. Google Ads settings and live campaigns were not changed.

| Ad group | Page | Search intent covered | Suggested headline alignment |
| --- | --- | --- | --- |
| Junk Removal | `/junk-removal-auckland` | Junk removal Auckland, junk collection, junk pickup, property clear-outs | Junk Removal Auckland |
| Rubbish Removal | `/rubbish-removal-auckland` | Household rubbish removal, rubbish pickup, same-day availability, rubbish removal service | Rubbish Removal Auckland |
| Furniture & Couch | `/furniture-removal-auckland` | Couch/sofa disposal, furniture disposal, mattress removal, fridge and appliance removal | Couch & Furniture Removal |
| Cost & Waste | `/rubbish-removal-cost-auckland` | Rubbish/junk removal costs, waste collection, dump runs, skip alternatives, private versus council inorganic collection | Fixed Price From a Photo |

The furniture page also has `#couch-disposal`, `#mattress-removal`, `#fridge-removal` and `#appliance-removal` anchors for more specific links when useful. All quote CTAs return to the form on the current landing page.

## Content-gap findings

The supplied Auction Insights screenshot identifies competing domains and auction visibility. It cannot establish which content is causing auction performance. These additions are based on comparing the current homepage's service summary with competitors' actual pages, using original copy rather than reproducing theirs.

| Gap in the current homepage | What the new pages add | Research reference |
| --- | --- | --- |
| Pricing is mentioned but not explained | Load, material, access and location factors; exactly what the quote includes; photo guidance | [Clean Sweep pricing](https://www.mycleansweep.co.nz/pricing/), [Chuck pricing help](https://chuck.nz/help) |
| Bulky-item searches have only a broad service card | Couch, mattress, fridge and appliance sections; stairs, dimensions and preparation advice | [Clean Sweep furniture and appliances](https://www.mycleansweep.co.nz/furniture-appliance-removal/), [Rubbish Gone services](https://www.rubbish-gone.co.nz/) |
| The collection arrangements are unclear | Single-item pickups, indoor collection planning, stairs, parking, preferred collection times and qualified same-day availability | [Rubbish Gone FAQs](https://www.rubbish-gone.co.nz/), [Clean Sweep FAQs](https://www.mycleansweep.co.nz/faqs/) |
| Price-sensitive visitors cannot compare options | Private pickup versus skip hire, DIY dump run and council inorganic collection | [Junk2Go skip-bin alternative](https://junk2go.co.nz/residential-rubbish-removal/skip-bin-hire-alternative/), [Auckland Council booking information](https://inorganiccollections.aucklandcouncil.govt.nz/Inorganic/) |
| Visitors need reassurance about the job's boundaries | Specialist-material disclosure, appliance disconnection planning, condition-dependent donation/recycling, and separate council-service information | The existing business service scope and the council information above |
| One broad page serves several search intents | A distinct headline, introduction, service examples, pricing explanation and six FAQs per ad group | The supplied four-ad-group brief |

The owner requested using the researched amounts in a Junk Removals pricing guide, with no competitor names or source links on the landing pages. All four pages now show indicative guide prices, original service descriptions and a clear statement that the final quote depends on the items, materials, suburb and access. At the owner’s request, customer-facing GST labels were removed and each guide row was reduced once by a randomly selected NZ$5–$7 (the same reduction applies to both ends of each range). The adjusted prices are stored as fixed values and do not change on page load. Original research references remain below for internal maintenance. Collection time is subject to availability; no recycling percentage, guaranteed donation, unsupported licence, accreditation or new response-time guarantee is advertised.

The existing review dataset includes gardening work around Tauranga and is not suitable as evidence for Auckland furniture or rubbish collections. It is not used on these pages. Verified relevant customer reviews or genuine removal job photos would be useful future additions. The current hero asset reuses and locally optimises the existing homepage illustration; it is not presented as a customer job or a before-and-after result.

## Form and conversion behaviour

- Every landing page renders the same existing `MovingQuoteLeadForm`, including required phone validation, up to ten photos, HEIC conversion, resizing, provider delivery, confirmation email and retry handling.
- Each page supplies its own `formName` for enquiry email subjects.
- The existing GTM event `quote_form_submission` and its `formName: "Junk Removal Quote"` are preserved, so existing trigger filters remain compatible.
- Additional context is available in `dataLayer.formData.enquiryType` and `dataLayer.formData.landingPage` after a successful submission. Existing click-ID capture and Google Ads conversion handling continue through the shared form.
- No additional form instance, duplicate conversion event or new live HubSpot form is introduced.

## Search and navigation

Each page has a self-referencing canonical, unique title and description, Open Graph metadata, Service structured data and breadcrumbs. The sitemap includes all four routes. Shared footer links make the pages reachable from the homepage and each other. Unknown service slugs return 404 rather than producing generic duplicate pages.

These pages target a better match between searches, ads and useful content. Lower cost per lead and improved landing-page diagnostics must be measured after launch; they are not guaranteed by adding routes. Google's [Quality Score guidance](https://support.google.com/google-ads/answer/6167118) describes Quality Score as a diagnostic rather than an auction input. Monitor qualified leads, cost per lead and the landing-page-experience component alongside ad relevance and expected CTR.

## Editing and reuse

- Content and page mapping: `utils/serviceLandingPages.mjs`.
- Shared page composition: `Components/Pages/ServiceLandingPage/ServiceLandingPage.jsx`.
- Customer-facing price figures and scope: `utils/removalPriceGuide.mjs`.
- Reusable price table: `Components/UI/Layout/Sections/ServiceInformationSection/PriceExamples.jsx`.
- Reusable collection/pricing section: `Components/UI/Layout/Sections/ServiceInformationSection/ServiceInformationSection.jsx`.
- Routes and metadata: `app/[landingPage]/page.js`.
- The existing service-card section now accepts `columns={3}` and optional item anchors, keeping its original four-column default for the homepage.

A new landing page can be added to the content map with its own service copy. The shared route, metadata, footer links and sitemap will pick it up at the next build. Keep claims and any published rates grounded in approved business information.

## Verification

- `npm run build`: passes; all four pages are generated as static HTML.
- `node --test tests/*.test.mjs`: all 47 existing submission, upload and email tests pass.
- HTTP checks: 200 responses, one H1, one form, required phone, multiple-photo input, correct canonical and unique working section anchors on all four routes; sitemap coverage and unknown-page 404 checked.
- Browser checks: desktop furniture and cost pages; FAQ expansion; mobile quote CTA staying on the current landing page; blank phone validation; all four pages at a 390-pixel viewport with no horizontal overflow.
- No live quote, customer email or advertising change was sent during page QA. Valid form submission still needs a controlled live delivery check after deployment.

The changes are local to this repository and have not been deployed. Run `npm run dev -- --port 3001` to preview the page paths above.

## Published price references

| Source | Published example | Tax treatment stated by source |
| --- | --- | --- |
| [Junk2Go pricing](https://junk2go.co.nz/pricing/) | Collections from NZ$109, with a two-person crew and truck | Including GST |
| [Clean Sweep pricing](https://www.mycleansweep.co.nz/pricing/) | Household clutter around 3 m³: NZ$150–$250; green waste around 2 m³: NZ$100–$160; garage around 4 m³: NZ$180–$300 | Including GST |
| [Clean Sweep pricing](https://www.mycleansweep.co.nz/pricing/) | Two-seater sofa, fridge and a few smaller items within 10 km: NZ$120–$180 | Including GST |
| [Junk Busters](https://www.junkbusters.co.nz/) | Two-seater couch: NZ$120; top-loading washer: NZ$50; dryer: NZ$30 | Not stated on the cited page |

These references record the original research behind the owner-approved indicative guide. They are internal documentation and are not rendered on the landing pages. Keep the guide conditional on the job scope and confirm the final total, including any applicable GST, in the quote. A different Clean Sweep-branded domain appeared in search snippets with separate mattress/fridge rates, but its opened pricing page did not show those figures; those unverified amounts were excluded.

## Owner photo gallery

The shared gallery uses the owner’s two numbered before/after pairs and seven collection photos from `public/images`. Optimised, auto-oriented WebP copies live in `public/gallery` (11 images, around 3.5 MB total); source JPEGs are retained. `utils/removalGallery.mjs` supplies the image pairs, dimensions and alt text. The section appears on all four service landing pages, the homepage and the dedicated quote page. On the homepage it fills the gallery block or inserts one after the service cards. Two featured comparisons support dragging, touch and keyboard arrows; the remaining photos open in the existing enlarged photo viewer.
