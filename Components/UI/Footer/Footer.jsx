import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Copyright from "./Copyright";
import ContactInfo from "./ContactInfo";
import FooterCta from "../CTA/FooterCta";
import styles from "./Footer.module.scss";
export default function Footer({
  footerCtaData,
  showFooterCta = true,
  contactInfo,
}) {
  return (
    <>
      {showFooterCta && (
        <FooterCta
          title={footerCtaData.title}
          description={footerCtaData.description}
          ctaArray={footerCtaData.cta}
        />
      )}

      <div className={`${styles.footerSection}`}>
        <Container maxWidth="xl" className="row">
          <div className={`${styles.footerWrapper}`}>
            <div className={`${styles.footerMessage}`}>
              <Typography component="p" variant="overline" className={`${styles.eyebrow}`}>
                Junk Removals Auckland
              </Typography>
              <Typography component="h2" variant="h5" className={`${styles.messageTitle}`}>
             Ready to clear some space?
              </Typography>
              <Typography component="p" variant="body1" className={`${styles.messageText}`}>
Tell us what needs to go and get a fixed-price quote for junk removal across Auckland. Labour, loading and tip fees included.              </Typography>
            </div>

            <div className={`${styles.contactWrapper}`}>

              <div className="contact-section">
           
                <ContactInfo contactInfo={contactInfo} />
              </div>


            </div>
          </div>
        </Container>
      </div>
      {/* copyright container */}
      <Copyright />
    </>
  );
}
