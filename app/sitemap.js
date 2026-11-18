import { LANDING_PAGE_LINKS } from "@/utils/serviceLandingPages.mjs";
import { SITE_URL } from "@/utils/siteMetadata";

export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...LANDING_PAGE_LINKS.map(page => ({ url: `${SITE_URL}/${page.slug}`, changeFrequency: "monthly", priority: 0.8 })),
  ];
}
