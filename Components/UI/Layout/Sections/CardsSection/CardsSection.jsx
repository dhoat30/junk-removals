
import styles from './CardsSection.module.scss';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardsSectionCarousel from './CardsSectionCarousel';
export default function CardsSection ({ title, subtitle, description, cards }) {
  if (!cards) return null;

  return (
    <section id="our-services" className={`${styles.section}`}>
      <Container maxWidth="xl" className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {subtitle ? (
              <Typography variant="h5" component="div" className={styles.subtitle}>
                {subtitle}
              </Typography>
            ) : null}
            <Typography variant="h2" component="h2" className={styles.title}>
              {title}
            </Typography>
          </div>
          {description && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      </Container>
        <CardsSectionCarousel cards={cards} />
    </section>
  );
}
