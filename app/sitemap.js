import { SITE_URL } from "@/utils/siteMetadata";

export default function sitemap() {
  return [{ url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 }];
}
