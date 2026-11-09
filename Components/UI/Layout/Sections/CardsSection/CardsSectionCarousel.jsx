"use client";

import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import styles from "./CardsSection.module.scss";

export default function CardsSectionCarousel({ cards }) {
  const cardsJSX = cards.map((card, index) => {
    const imageSrc = card?.image?.sizes?.large || card?.image?.url;
    // The lead service runs at double width, which also squares the grid off.
    const isFeatured = index === 0;

    return (
      <article
        key={index}
        className={`${styles.card} ${isFeatured ? styles.featured : ""}`}
      >
        <div className={styles.cardFrame}>
          <div
            className={`${styles.imageWrapper} image-wrapper`}
            style={isFeatured ? undefined : { paddingBottom: "68%" }}
          >
            <div className={styles.cardLabel}>0{index + 1}</div>

            {imageSrc ? (
              <Image
                className={styles.cardImage}
                src={imageSrc}
                alt={card?.image?.alt || card.title}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={isFeatured}
              />
            ) : null}
          </div>

          <div className={styles.contentWrapper}>
            {card?.subtitle ? (
              <Typography variant="overline" component="div" className={styles.cardSubtitle}>
                {card.subtitle}
              </Typography>
            ) : null}

            <Typography variant="h5" component="h3" className={styles.cardTitle}>
              {card.title}
            </Typography>

            <div
              className={styles.cardDescription}
              dangerouslySetInnerHTML={{ __html: card.description }}
            />

            {Array.isArray(card.attributes) && card.attributes.length > 0 ? (
              <ul className={styles.chipList}>
                {card.attributes.map((attribute, attributeIndex) =>
                  attribute?.label ? (
                    <li key={attributeIndex} className={styles.chip}>
                      {attribute.label}
                    </li>
                  ) : null
                )}
              </ul>
            ) : null}

            {card.cta &&
              card.cta.map((item, indexKey) => (
                <Link key={indexKey} href={item.link.url} className={styles.cardLink}>
                  <Typography variant="subtitle1" component="span" className={styles.cardLinkText}>
                    {item.link.title}
                  </Typography>
                </Link>
              ))}
          </div>
        </div>
      </article>
    );
  });

  return (
    <div className={styles.cardsWrapper}>
      <Container maxWidth="xl">
        <div className={styles.cardsGrid}>{cardsJSX}</div>
      </Container>
    </div>
  );
}
