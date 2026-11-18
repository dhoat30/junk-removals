import Header from "@/Components/UI/Header/Header";
import Footer from "@/Components/UI/Footer/Footer";
import LandingPageHeroSection from "@/Components/UI/Layout/Sections/LandingPageHeroSection/LandingPageHeroSection";
import ServiceCardsSection from "@/Components/UI/Layout/Sections/ServiceCardsSection/ServiceCardsSection";
import ServiceInformationSection from "@/Components/UI/Layout/Sections/ServiceInformationSection/ServiceInformationSection";
import AreasCoveredSection from "@/Components/UI/Layout/Sections/AreasCoveredSection/AreasCoveredSection";
import RegularProcess from "@/Components/UI/Layout/Sections/Process/RegularProcess";
import FaqAccordionSection from "@/Components/UI/Layout/Sections/FaqAccordionSection/FaqAccordionSection";
import FooterCta from "@/Components/UI/CTA/FooterCta";
import { SITE_NAME, SITE_URL } from "@/utils/siteMetadata";
import { REMOVAL_PRICE_GUIDES } from "@/utils/removalPriceGuide.mjs";
import BeforeAfterGallerySection from "@/Components/UI/Layout/Sections/BeforeAfterGallerySection/BeforeAfterGallerySection";
import { DEFAULT_REMOVAL_GALLERY_SECTION } from "@/utils/removalGallery.mjs";

export default function ServiceLandingPage({ page, slug }) {
  const phone = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  const schema = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Service", "@id": `${SITE_URL}/${slug}#service`, name: page.label + " Auckland", description: page.description, url: `${SITE_URL}/${slug}`, serviceType: page.label, areaServed: { "@type": "City", name: "Auckland" }, provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL, ...(phone ? { telephone: phone } : {}) } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.label, item: `${SITE_URL}/${slug}` },
      ] },
    ],
  };
  const pricing = <ServiceInformationSection id="pricing" {...page.pricing} examples={REMOVAL_PRICE_GUIDES[page.adGroup === "Furniture & Couch" ? "items" : "loads"]} muted />;
  const information = <ServiceInformationSection id="collection-details" {...page.information} />;
  return (
    <>
      <Header localSections />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
        <LandingPageHeroSection title={page.headline} description={page.intro} aboveTitleUsp="Locally owned. Auckland-wide."
          uspData={{ text_usp: page.benefits.map(value => ({ value })) }} image={page.image} formName={page.formName} />
        <ServiceCardsSection title={page.servicesTitle} description={page.servicesDescription} cards={page.cards} quoteHref="#get-free-quote" columns={3} />
        <BeforeAfterGallerySection {...DEFAULT_REMOVAL_GALLERY_SECTION} />
        {page.adGroup === "Cost & Waste" ? <>{pricing}{information}</> : <>{information}{pricing}</>}
        <RegularProcess title={`<h2>${page.processTitle}</h2>`} cards={page.processCards} ctaArray={[{ link: { url: "#get-free-quote", title: "Get my free quote" } }]} />
        <AreasCoveredSection title={`${page.adGroup === "Furniture & Couch" ? "Furniture collection" : page.adGroup === "Rubbish Removal" ? "Rubbish removal" : "Junk and rubbish pickups"} across Auckland`}
          description="Central Auckland, North Shore, West Auckland, East Auckland and South Auckland. Check the areas below and send your address so we can confirm collection availability."
          quoteHref="#get-free-quote" />
        <FaqAccordionSection id="faqs" title={page.faqTitle} description="A few useful details before you arrange your collection. You can also call us to talk through the job." qaData={page.faqs} />
        <FooterCta title={page.ctaTitle} description={page.ctaDescription} ctaArray={[
          { link: { url: "#get-free-quote", title: "Get a free quote" } },
          ...(phone ? [{ link: { url: `tel:${phone.replace(/[^\d+]/g, "")}`, title: `Call ${phone}` } }] : []),
        ]} />
      </main>
      <Footer showFooterCta={false} />
    </>
  );
}
