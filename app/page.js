export const revalidate = 2592000; // applies to both page and metadata

import Header from '@/Components/UI/Header/Header'
import {getSinglePostData} from '@/utils/fetchData'
import Footer from '@/Components/UI/Footer/Footer'
import Layout from '@/Components/UI/Layout/Layout'
import { notFound } from "next/navigation";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/utils/siteMetadata";
import { DEFAULT_AREAS_COVERED_SECTION } from "@/utils/aucklandCoverage";
import { DEFAULT_SERVICE_CARDS_SECTION } from "@/utils/junkRemovalServices";
import reviewsData from "@/data/google-reviews.json";



export const metadata = {
    title: "Junk Removal Auckland | Same-Day Pickups | Junk Removals",
    description: SITE_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/" },
    openGraph: {
        title: "Junk Removal Auckland | Junk Removals",
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        siteName: SITE_NAME,
        locale: "en_NZ",
        type: "website",
        images: [{ url: "/logo.png", alt: SITE_NAME }],
    },
};

  export default async function Home() {
    const data = await getSinglePostData( 'junk-removals', '/wp-json/wp/v2/cleaning-business')
    if (!data?.length) notFound()
    const sections = [...(data[0]?.acf?.layout || [])]
    // Show the services now; a CMS service_cards block takes over when added.
    if (!sections.some((section) => section.acf_fc_layout === "service_cards")) {
        const heroIndex = sections.findIndex((section) =>
            ["form_section", "landing_page_hero_section", "form_hero_section"].includes(section.acf_fc_layout)
        )
        sections.splice(heroIndex + 1, 0, DEFAULT_SERVICE_CARDS_SECTION)
    }
    if (!sections.some((section) => ["areas_covered", "locations_covered"].includes(section.acf_fc_layout) || (section.acf_fc_layout === "show_locations" && section.show_locations))) {
        const servicesIndex = sections.findIndex((section) => section.acf_fc_layout === "service_cards")
        sections.splice(servicesIndex + 1, 0, DEFAULT_AREAS_COVERED_SECTION)
    }
    return (
        <>
            <Header />
            <main>

            <Layout sections={sections}  googleReviewsData={reviewsData}
/>
            </main>
            <Footer showFooterCta={false} />
        </>
    )
}
