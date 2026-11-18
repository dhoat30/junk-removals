import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import styles from "./FooterCTA.module.scss";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

export default function FooterCta({ title, description, ctaArray }) {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  const suppliedCtas = Array.isArray(ctaArray) ? ctaArray.filter(cta => cta?.link?.url) : [];
  const ctas = suppliedCtas.length ? suppliedCtas : [
    { link: { url: "/#get-free-quote", title: "Get a free quote" } },
    ...(phoneNumber ? [{ link: { url: `tel:${phoneNumber.replace(/[^\d+]/g, "")}`, title: `Call ${phoneNumber}` } }] : []),
  ];

  return (
    <section className={styles.section}>
      <Container maxWidth="xl">
        <div className={styles.wrapper}>
          <div className={styles.contentWrapper}>
            <p className={styles.eyebrow}>Your next pickup starts here</p>
            <Typography component="h2" variant="h2" className={styles.title}>
              {title}
            </Typography>
            <Typography component="div" variant="body1" className={styles.description}>
              {description}
            </Typography>
            <div className={styles.reassurance}>
              <span><CheckRoundedIcon aria-hidden="true" />Free quote</span>
              <span><CheckRoundedIcon aria-hidden="true" />No obligation</span>
            </div>
          </div>
          <div className={styles.actions}>
            {ctas.map((cta, index) => {
              const isPhone = cta.link.url.startsWith("tel:");
              return (
                <Button
                  component={Link}
                  href={cta.link.url}
                  key={`${cta.link.url}-${index}`}
                  size="large"
                  variant={isPhone || index > 0 ? "outlined" : "contained"}
                  className={isPhone || index > 0 ? styles.secondaryButton : styles.quoteButton}
                  startIcon={isPhone ? <LocalPhoneOutlinedIcon /> : undefined}
                  endIcon={!isPhone ? <ArrowForwardIcon /> : undefined}
                >
                  {cta.link.title}
                </Button>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
