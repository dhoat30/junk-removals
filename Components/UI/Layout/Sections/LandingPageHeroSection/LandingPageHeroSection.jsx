import React from "react";
import styles from "./LandingPageHeroSection.module.scss";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import GoogleReviewSnippet from "@/Components/UI/GoogleReviews/GoogleReviewCard/GoogleReviewSnippet";
import HeroUSPBox from "@/Components/UI/USP/HeroUSPBox";
import MovingQuoteLeadForm from "@/Components/UI/Forms/MovingQuoteLeadForm";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";

export default function LandingPageHeroSection({
  title,
  reviewTitle,
  description,
  uspData,
  reviewerPics,
  aboveTitleUsp,
  trustSnippet,
  image,
}) {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  const trustSnippetDescription =
    trustSnippet?.subtitle || trustSnippet?.snippet || "";

  // Some layouts (form_section) send plain text rather than markup, which would
  // otherwise land in a bare div and miss the heading styles entirely.
  const containsMarkup = (value) => /<[a-z][\s\S]*>/i.test(value || "");

  return (
    <section className={`${styles.section}`}>
      <div className={`${styles.container}`}>
        <div className={`${styles.heroGrid} max-width-xl`}>
          <div className={styles.contentColumn}>

            {aboveTitleUsp ? (
              <div className={`${styles.titleUSP} flex gap-8 mb-16 align-center`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.84922 8.61998C3.70326 7.9625 3.72567 7.27882 3.91437 6.63231C4.10308 5.98581 4.45196 5.39742 4.92868 4.9217C5.40541 4.44597 5.99453 4.09832 6.64142 3.91097C7.28832 3.72362 7.97205 3.70264 8.62922 3.84998C8.99093 3.28428 9.48922 2.81873 10.0782 2.49626C10.6671 2.17379 11.3278 2.00476 11.9992 2.00476C12.6707 2.00476 13.3313 2.17379 13.9203 2.49626C14.5092 2.81873 15.0075 3.28428 15.3692 3.84998C16.0274 3.702 16.7123 3.72288 17.3602 3.91069C18.0081 4.09849 18.598 4.44712 19.0751 4.92413C19.5521 5.40114 19.9007 5.99105 20.0885 6.63898C20.2763 7.28691 20.2972 7.97181 20.1492 8.62998C20.7149 8.99168 21.1805 9.48998 21.5029 10.0789C21.8254 10.6679 21.9944 11.3285 21.9944 12C21.9944 12.6714 21.8254 13.3321 21.5029 13.921C21.1805 14.51 20.7149 15.0083 20.1492 15.37C20.2966 16.0271 20.2756 16.7109 20.0882 17.3578C19.9009 18.0047 19.5532 18.5938 19.0775 19.0705C18.6018 19.5472 18.0134 19.8961 17.3669 20.0848C16.7204 20.2735 16.0367 20.2959 15.3792 20.15C15.018 20.7178 14.5193 21.1854 13.9293 21.5093C13.3394 21.8332 12.6772 22.003 12.0042 22.003C11.3312 22.003 10.669 21.8332 10.0791 21.5093C9.48914 21.1854 8.99045 20.7178 8.62922 20.15C7.97205 20.2973 7.28832 20.2763 6.64142 20.089C5.99453 19.9016 5.40541 19.554 4.92868 19.0783C4.45196 18.6025 4.10308 18.0141 3.91437 17.3676C3.72567 16.7211 3.70326 16.0374 3.84922 15.38C3.27917 15.0192 2.80963 14.5201 2.48426 13.9292C2.1589 13.3382 1.98828 12.6746 1.98828 12C1.98828 11.3254 2.1589 10.6617 2.48426 10.0708C2.80963 9.4798 3.27917 8.98073 3.84922 8.61998Z" stroke="var(--light-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12L11 14L15 10" stroke="var(--light-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Typography variant="subtitle1" component="div" color={`var(--light-primary)`}>
                  {aboveTitleUsp}
                </Typography>
              </div>
            ) : null}

            {containsMarkup(title) ? (
              <div
                dangerouslySetInnerHTML={{ __html: title }}
                className={styles.title}
              />
            ) : (
              <div className={styles.title}>
                <h1>{title}</h1>
              </div>
            )}

            {containsMarkup(description) ? (
              <div
                dangerouslySetInnerHTML={{ __html: description }}
                className={styles.description}
              />
            ) : (
              <div className={styles.description}>
                <p>{description}</p>
              </div>
            )}

            <div className={styles.mobileActions}>
              <a className={styles.quoteButton} href="#get-free-quote">
                Get a quote
              </a>
              {phoneNumber ? (
                <a
                  className={styles.phoneButton}
                  href={`tel:${phoneNumber.replace(/[^\d+]/g, "")}`}
                  aria-label={`Call ${phoneNumber}`}
                >
                  <LocalPhoneIcon aria-hidden="true" />
                  <span>{phoneNumber}</span>
                </a>
              ) : null}
            </div>

            <HeroUSPBox
              data={uspData}
              className={styles.uspBox}
              leftAligned={true}
            />

            <div className={styles.reviewWrapper}>
              {/* <GoogleReviewSnippet
                reviewerPics={reviewerPics}
                reviewTitle={reviewTitle}
                leftAligned={true}
                className={styles.reviewSnippet}
              /> */}

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
                  <div className={styles.titleWrapper}>
                    {trustSnippet?.title ? (
                      <Typography variant="subtitle2" component="div" className={styles.trustSnippetTitle}>
                        {trustSnippet.title}
                      </Typography>
                    ) : null}
                    {trustSnippetDescription ? (
                      <Typography variant="body2" component="div" className={styles.trustSnippetDescription}>
                        {trustSnippetDescription}
                      </Typography>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {image?.url ? (
              <div className={styles.heroMedia}>
                <Image
                  src={image.url}
                  alt={image.alt || "Junk Removals team"}
                  width={image.width || 1200}
                  height={image.height || 900}
                  sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 1100px) 560px, (max-width: 1440px) 45vw, 560px"
                  className={styles.heroImage}
                  priority
                />
              </div>
            ) : null}
          </div>

          <div className={styles.formColumn} id="get-free-quote">
            <MovingQuoteLeadForm className={styles.heroForm} />
          </div>
        </div>
      </div>
    </section>
  );
}
