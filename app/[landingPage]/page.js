import { notFound } from "next/navigation";
import ServiceLandingPage from "@/Components/Pages/ServiceLandingPage/ServiceLandingPage";
import { SERVICE_LANDING_PAGES, getServiceLandingPage } from "@/utils/serviceLandingPages.mjs";
import { SITE_NAME, SITE_URL } from "@/utils/siteMetadata";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(SERVICE_LANDING_PAGES).map(landingPage => ({ landingPage }));
}
export async function generateMetadata({ params }) {
  const { landingPage } = await params;
  const page = getServiceLandingPage(landingPage);
  if (!page) notFound();
  return {
    title: page.title, description: page.description, metadataBase: new URL(SITE_URL),
    alternates: { canonical: `/${landingPage}` },
    openGraph: { title: page.title, description: page.description, url: `${SITE_URL}/${landingPage}`, siteName: SITE_NAME, locale: "en_NZ", type: "website", images: [{ url: "/logo.png", alt: SITE_NAME }] },
    twitter: { card: "summary", title: page.title, description: page.description },
  };
}
export default async function Page({ params }) {
  const { landingPage } = await params;
  const page = getServiceLandingPage(landingPage);
  if (!page) notFound();
  return <ServiceLandingPage page={page} slug={landingPage} />;
}
