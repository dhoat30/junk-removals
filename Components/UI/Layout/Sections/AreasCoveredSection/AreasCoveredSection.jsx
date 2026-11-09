import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { AUCKLAND_COVERAGE_AREAS } from "@/utils/aucklandCoverage";
import styles from "./AreasCoveredSection.module.scss";

export default function AreasCoveredSection({
  title = "Junk removal across Auckland",
  description = "We cover all of Auckland and nearby suburbs. Wherever you are, we'll come to you and take care of the heavy lifting.",
  areas = AUCKLAND_COVERAGE_AREAS,
  quoteHref = "/#get-free-quote",
}) {
  if (!areas?.length) return null;

  return (
    <section id="areas-covered" className={styles.section}>
      <Container maxWidth="xl">
        <div className={styles.header}>
          <div>
            <Typography variant="overline" component="p" className={styles.eyebrow}>
              Areas we cover
            </Typography>
            <Typography variant="h2" component="h2" className={styles.title}>
              {title}
            </Typography>
          </div>
          <Typography variant="body1" component="p" className={styles.description}>
            {description}
          </Typography>
        </div>

        <div className={styles.grid}>
          {areas.map((area) => (
            <article className={styles.areaCard} key={area.title}>
              <div className={styles.areaHeading}>
                <LocationOnOutlinedIcon className={styles.locationIcon} aria-hidden="true" />
                <Typography variant="h5" component="h3" className={styles.areaTitle}>
                  {area.title}
                </Typography>
              </div>
              <ul className={styles.suburbs}>
                {area.suburbs?.map((suburb) => {
                  const label = typeof suburb === "string" ? suburb : suburb.name;
                  return (
                    <li key={label}>
                      <Typography variant="body2" component="span">{label}</Typography>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>

        <Typography variant="body2" component="p" className={styles.coverageNote}>
          These are just some of the suburbs we cover. Our service is Auckland-wide.
        </Typography>

        <div className={styles.callout}>
          <div>
            <Typography variant="h5" component="h3" className={styles.calloutTitle}>
              Don’t see your suburb?
            </Typography>
            <Typography variant="body1" component="p" className={styles.calloutDescription}>
              Send us your address and we’ll confirm we can help.
            </Typography>
          </div>
          <Button component="a" href={quoteHref} variant="contained" endIcon={<ArrowForwardRoundedIcon />} className={styles.quoteButton}>
            Get a free quote
          </Button>
        </div>
      </Container>
    </section>
  );
}
