import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { AUCKLAND_COVERAGE_AREAS } from "@/utils/aucklandCoverage";
import styles from "./AreasCoveredSection.module.scss";

export default function AreasCoveredSection({
  title = "Junk removal across Auckland",
  description = "Browse Auckland suburbs and surrounding localities below. Send us your address for a fixed-price junk removal quote.",
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
            <details className={styles.areaCard} key={area.title}>
              <summary className={styles.areaHeading}>
                <LocationOnOutlinedIcon className={styles.locationIcon} aria-hidden="true" />
                <Typography variant="h5" component="h3" className={styles.areaTitle}>
                  {area.title}
                </Typography>
                <span className={styles.count}>{area.suburbs?.length || 0}</span>
              </summary>
              {area.note && <p className={styles.areaNote}>{area.note}</p>}
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
            </details>
          ))}
        </div>

        <Typography variant="body2" component="p" className={styles.coverageNote}>
          Open an area to browse its suburbs and localities. Rural and island pickups are subject to availability — send us your address to confirm.
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
