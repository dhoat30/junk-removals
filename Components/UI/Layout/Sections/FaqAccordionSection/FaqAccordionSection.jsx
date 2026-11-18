import CustomAccordion from "../../../Accordion/CustomAccordion";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import styles from "./FaqAccordionSection.module.scss";

export default function FaqAccordionSection({ id, title, description, qaData }) {
  if (!qaData?.length) return null;
  const phone = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  return (
    <section id={id} className={styles.section}>
      <Container maxWidth="xl">
        <div className={styles.grid}>
          <div className={styles.introduction}>
            <p className={styles.eyebrow}>Good to know</p>
            <Typography variant="h2" component="h2" className={styles.title}>{title}</Typography>
            {description ? <p className={styles.description}>{description}</p> : null}
            <div className={styles.help}>
              <span className={styles.helpIcon} aria-hidden="true"><LocalPhoneOutlinedIcon /></span>
              <div>
                <h3>Have something else in mind?</h3>
                <p>Talk us through your items and we’ll help you plan the pickup.</p>
                {phone ? (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={styles.contactLink}>Call {phone}<ArrowForwardRoundedIcon aria-hidden="true" /></a>
                ) : (
                  <a href="#get-free-quote" className={styles.contactLink}>Ask us for a quote<ArrowForwardRoundedIcon aria-hidden="true" /></a>
                )}
              </div>
            </div>
          </div>
          <CustomAccordion qaData={qaData} variant="faq" defaultExpanded />
        </div>
      </Container>
    </section>
  );
}
