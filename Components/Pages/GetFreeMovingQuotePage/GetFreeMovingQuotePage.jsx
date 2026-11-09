import Image from "next/image";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import MovingQuoteLeadForm from "@/Components/UI/Forms/MovingQuoteLeadForm";
import HeroUSPBox from "@/Components/UI/USP/HeroUSPBox";
import GoogleReviewSnippet from "@/Components/UI/GoogleReviews/GoogleReviewCard/GoogleReviewSnippet";
import styles from "./GetFreeMovingQuotePage.module.scss";

export default function GetFreeMovingQuotePage({ heroContent, reviewerPics }) {
  const title = heroContent?.title;
  const description = heroContent?.description;
  const uspData = heroContent?.usp;
  const reviewTitle = heroContent?.review_title || "Loved by Auckland locals";
  const aboveTitleUsp = heroContent?.above_title_usp;
  const trustSnippet = heroContent?.trust_snippet;
  const trustSnippetDescription =
    trustSnippet?.subtitle || trustSnippet?.snippet || "";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container maxWidth="lg" className={styles.heroInner}>
          <div className={styles.contentColumn}>
            {aboveTitleUsp ? (
              <div className={styles.promoPill}>
                <span className={styles.promoDot} />
                {aboveTitleUsp}
              </div>
            ) : null}

            {title ? (
              <div
                dangerouslySetInnerHTML={{ __html: title }}
                className={styles.title}
              />
            ) : null}

            {description ? (
              <div
                dangerouslySetInnerHTML={{ __html: description }}
                className={styles.description}
              />
            ) : null}

            <HeroUSPBox data={uspData} className={styles.uspBox} />

            <div className={styles.reviewWrapper}>
              <GoogleReviewSnippet
                reviewerPics={reviewerPics}
                reviewTitle={reviewTitle}
                leftAligned={true}
              />

              {trustSnippet?.icon?.url || trustSnippet?.title || trustSnippetDescription ? (
                <div className={styles.trustSnippetWrapper}>
                  {trustSnippet?.icon?.url ? (
                    <Image
                      src={trustSnippet.icon.url}
                      alt={trustSnippet.icon.alt || trustSnippet.title || "Trust badge"}
                      width={34}
                      height={34}
                      priority
                    />
                  ) : null}
                  <div className={styles.trustSnippetText}>
                    {trustSnippet?.title ? (
                      <Typography
                        variant="subtitle2"
                        component="div"
                        className={styles.trustSnippetTitle}
                      >
                        {trustSnippet.title}
                      </Typography>
                    ) : null}
                    {trustSnippetDescription ? (
                      <Typography
                        variant="body2"
                        component="div"
                        className={styles.trustSnippetDescription}
                      >
                        {trustSnippetDescription}
                      </Typography>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.formColumn}>
            <MovingQuoteLeadForm />
          </div>
        </Container>
      </section>
    </div>
  );
}
