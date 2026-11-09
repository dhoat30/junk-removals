// The business's confirmed Google total can be higher than the saved snapshot.
export const GOOGLE_REVIEW_COUNT = 112;
export const HOMEPAGE_REVIEW_LIMIT = 8;

export const getReviewText = (review) => review.text ?? review.snippet ?? "";
export const getReviewRating = (review) => review.stars ?? review.rating;

export function getSortedReviews(data) {
  const reviews = Array.isArray(data) ? data : data?.reviews;
  if (!Array.isArray(reviews)) return [];
  return [...reviews].sort((a, b) =>
    (Date.parse(b.iso_date) || 0) - (Date.parse(a.iso_date) || 0)
  );
}

export function getReviewSummary(data) {
  const reviews = getSortedReviews(data);
  const rated = reviews.filter((review) => {
    const rating = getReviewRating(review);
    return typeof rating === "number" && rating >= 1 && rating <= 5;
  });
  const averageRating = rated.length
    ? rated.reduce((total, review) => total + getReviewRating(review), 0) / rated.length
    : 0;
  return {
    averageRating,
    totalReviewCount: Math.max(GOOGLE_REVIEW_COUNT, Number(data?.total) || reviews.length),
  };
}

export function formatReviewDate(isoDate) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Pacific/Auckland",
  }).format(date);
}
