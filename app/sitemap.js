import { SITE_URL } from "@/utils/siteMetadata";
import reviewsData from "@/data/google-reviews.json";

export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/hedge-trimming-tauranga`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/reviews`, lastModified: reviewsData.updatedAt, changeFrequency: "weekly", priority: 0.8 },
  ];
}
