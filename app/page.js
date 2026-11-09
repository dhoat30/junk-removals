export const revalidate = 2592000; // applies to both page and metadata

import Header from '@/Components/UI/Header/Header'
import {getSinglePostData} from '@/utils/fetchData'
import Footer from '@/Components/UI/Footer/Footer'
import Layout from '@/Components/UI/Layout/Layout'
import GoogleReviewsMasonry from '@/Components/UI/GoogleReviews/GoogleReviewsMasonry'
import { DEFAULT_SERVICE_CARDS_SECTION } from "@/utils/junkRemovalServices";
import reviewsData from "@/data/google-reviews.json";



export async function generateMetadata(props, parent) {
    const params = await props.params;
    // read route params
    const slug = params.slug

    // fetch data
    const data = await getSinglePostData( 'junk-removals', '/wp-json/wp/v2/cleaning-business')

    // optionally access and extend (rather than replace) parent metadata
    const previousImages = (await parent).openGraph?.images || []
    if (data.length > 0) {
        const seoData = data[0].yoast_head_json
        return {
            title: seoData.title,
            description: seoData.description,
            metadataBase: new URL(process.env.siteUrl),
            openGraph: {
                title: seoData.title,
                description: seoData.description,
                url: process.env.siteUrl,
                siteName: process.env.siteName,
                images: [
                    {
                        url: seoData?.og_image && seoData?.og_image[0]?.url,
                        width: 800,
                        height: 600,
                    }, {
                        url: seoData?.og_image && seoData?.og_image[0].url,
                        width: 1800,
                        height: 1600,
                    },

                ],
                type: 'website',
            },
        }
    }
}

  export default async function Home() {
    const data = await getSinglePostData( 'junk-removals', '/wp-json/wp/v2/cleaning-business')
    if(!data) return {notFound: true}
    const sections = [...(data[0]?.acf?.layout || [])]
    // Show the services now; a CMS service_cards block takes over when added.
    if (!sections.some((section) => section.acf_fc_layout === "service_cards")) {
        const heroIndex = sections.findIndex((section) =>
            ["form_section", "landing_page_hero_section", "form_hero_section"].includes(section.acf_fc_layout)
        )
        sections.splice(heroIndex + 1, 0, DEFAULT_SERVICE_CARDS_SECTION)
    }
    // The ACF layout has no "show_reviews" block yet, so render the reviews
    // here. If that block is added in WordPress, Layout renders them instead
    // and this guard keeps the section from appearing twice.
    const hasReviewsSection = sections?.some(
        (section) => section?.acf_fc_layout === "show_reviews"
    )
    return (
        <>
            <Header />
            <main>

            <Layout sections={sections}  googleReviewsData={reviewsData}
/>
            {/* {!hasReviewsSection && <GoogleReviewsMasonry data={reviewsData} />} */}
                {/* <Layout sections={postData[0]?.acf?.sections} /> */}
                {/* <USP showTitle={true} statsArray={options.stats.items} cards={options.usp.items} title={options.usp.section_title} description={options.usp.section_description} /> */}
            

            </main>
            <Footer showFooterCta={false

            } footerCtaData={{title: "Get a quote for your property", description: "Tell us what needs doing and we'll come back with a price, usually the same day. Lawn mowing from $35, no fixed-term contract.", cta_link: {url: "/#get-free-quote", title: "GET A QUOTE"}}  }/>
        </>
    )
}
