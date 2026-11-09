import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Button from "@mui/material/Button";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  formatReviewDate, getReviewRating, getReviewSummary, getReviewText,
  getSortedReviews, HOMEPAGE_REVIEW_LIMIT,
} from "@/utils/reviews";
import GoogleIcon from "../Icons/GoogleIcon";
import styles from "./GoogleReviewsMasonry.module.scss";

const STARS = Array.from({ length: 5 });

function Stars({ className, rating = 5 }) {
  return (
    <div className={className} role="img" aria-label={`${rating} out of 5 stars`}>
      {STARS.map((_, index) => {
        const Icon = index < Math.round(rating) ? StarIcon : StarBorderIcon;
        return <Icon key={index} aria-hidden="true" sx={{ color: "#FABB05", fontSize: "1rem" }} />;
      })}
    </div>
  );
}

export default function GoogleReviewsMasonry({
  data,
  title = "What Tauranga customers say",
  description = "Read what local customers say about our lawn mowing and garden care across Tauranga and the Bay of Plenty.",
  preview = true,
  limit = HOMEPAGE_REVIEW_LIMIT,
  asPage = false,
}) {
  const reviews = getSortedReviews(data);

  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  const selected = preview ? reviews.filter((review) => {
    const text = getReviewText(review);
    return getReviewRating(review) === 5 && typeof text === "string" && text.trim().length > 0;
  }) : reviews;
  const visibleReviews = Number.isInteger(limit) ? selected.slice(0, limit) : selected;

  if (visibleReviews.length === 0) return null;

  const { averageRating, totalReviewCount } = getReviewSummary(data);

  return (
    <section id="google-reviews" className={`${styles.section} ${asPage ? styles.fullPage : ""}`} aria-labelledby="reviews-title">
      <Container maxWidth="xl" className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <Typography variant="h2" component={asPage ? "h1" : "h2"} className={styles.title} id="reviews-title">
              {title}
            </Typography>
            <Typography component="p" className={styles.description}>
              {description}
            </Typography>
          </div>

          <div className={styles.summary}>
            <div className={styles.score}>{averageRating.toFixed(1)}</div>
            <div className={styles.summaryMeta}>
              <Stars className={styles.summaryStars} rating={Number(averageRating.toFixed(1))} />
              <Typography component="p" className={styles.summaryCount}>
                <strong>{totalReviewCount} reviews</strong>
                <span>on Google</span>
              </Typography>
            </div>
            <div className={styles.summaryLogo}>
              <GoogleIcon />
            </div>
          </div>
        </div>

        <div className={styles.masonry}>
          {visibleReviews.map((review, index) => {
            const name = review.name ?? review.user?.name ?? "Google reviewer";
            const text = getReviewText(review);
            const rating = getReviewRating(review);
            const avatar = review.reviewerPhotoUrl ?? review.user?.thumbnail;
            const absoluteDate = asPage ? formatReviewDate(review.iso_date) : null;
            const displayDate = absoluteDate || review.date;

            return (
              <figure key={review.review_id ?? index} className={styles.reviewCard} id={`review-${index + 1}`}>
                <div className={styles.reviewHead}>
                  {avatar ? (
                    <Image
                      className={styles.avatar}
                      src={avatar}
                      alt={`${name} profile picture`}
                      width={44}
                      height={44}
                    />
                  ) : (
                    <span className={styles.avatarFallback} aria-hidden="true">
                      {name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}

                  <figcaption className={styles.reviewMeta}>
                    <Typography component="h3" className={styles.reviewName}>
                      {name}
                    </Typography>
                    <div className={styles.reviewSub}>
                      <Stars className={styles.reviewStars} rating={rating} />
                      {displayDate ? (
                        <time className={styles.reviewDate} dateTime={review.iso_date}>{displayDate}</time>
                      ) : null}
                    </div>
                  </figcaption>

                  <span className={styles.reviewLogo}>
                    <GoogleIcon />
                  </span>
                </div>

                {text.trim() ? (
                  <blockquote className={styles.reviewText}>{text}</blockquote>
                ) : (
                  <p className={`${styles.reviewText} ${styles.ratingOnly}`}>Rated {rating} out of 5.</p>
                )}
                {asPage && review.response?.snippet ? (
                  <details className={styles.response}>
                    <summary>Response from Junk Removals</summary>
                    <p>{review.response.snippet}</p>
                  </details>
                ) : null}
                {asPage && review.link ? (
                  <a href={review.link} className={styles.sourceLink} target="_blank" rel="noopener noreferrer">
                    View on Google <ArrowForwardIcon aria-hidden="true" />
                  </a>
                ) : null}
              </figure>
            );
          })}
        </div>
        {preview ? (
          <div className={styles.actions}>
            <Button href="/reviews" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
              Read all reviews
            </Button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
