import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import styles from "./ServiceInformationSection.module.scss";
import PriceExamples from "./PriceExamples";

// An editorial section for scope, pricing or collection advice on any service page.
export default function ServiceInformationSection({ id, eyebrow, title, description, rows, aside, examples, muted = false }) {
  return (
    <section id={id} className={`${styles.section} ${muted ? styles.muted : ""}`} aria-labelledby={`${id}-title`}>
      <Container maxWidth="xl">
        <div className={styles.grid}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 id={`${id}-title`} className={styles.title}>{title}</h2>
            <p className={styles.introduction}>{description}</p>
            <PriceExamples examples={examples} />
            <dl className={styles.rows}>
              {rows.map(row => (
                <div className={styles.row} key={row.title}>
                  <dt>{row.title}</dt>
                  <dd>{row.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className={styles.aside}>
            <h3>{aside.title}</h3>
            <ul>
              {aside.items.map(item => <li key={item}><CheckRoundedIcon aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
            <p>{aside.note}</p>
            <Button component="a" href="#get-free-quote" variant="contained" endIcon={<ArrowForwardRoundedIcon />} className={styles.button}>Get a free quote</Button>
          </aside>
        </div>
      </Container>
    </section>
  );
}
