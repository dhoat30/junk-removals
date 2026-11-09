import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import styles from "./ServicesListSection.module.scss";

export default function ServicesListSection({ title, description, list }) {
  if (!list || list.length === 0) return null;

  return (
    <section className={styles.section} id="services-list">
      <Container maxWidth="xl" className={styles.container}>
        <div className={styles.header}>
          <Typography variant="h2" component="h2" className={styles.title}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body1" component="p" className={styles.description}>
              {description}
            </Typography>
          ) : null}
        </div>

        <div className={styles.grid}>
          {list.map((item, index) => (
            <article key={`${item.title}-${index}`} className={styles.card}>
              {/* <div className={styles.cardNumber}>0{index + 1}</div> */}
              <Typography variant="h5" component="h3" className={styles.cardTitle}>
                {item.title}
              </Typography>
              <div
                className={styles.cardDescription}
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
