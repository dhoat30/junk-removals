"use client";

import { useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import BeforeAfterMasonry from "@/Components/UI/BeforeAfterSlider/BeforeAfterMasonry";
import styles from "./BeforeAfterGallerySection.module.scss";

export default function BeforeAfterGallerySection({ title, description, images }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeMedia, setActiveMedia] = useState("image");
  const [videoError, setVideoError] = useState(false);
  const galleryTitle = title?.trim() || "Our Work, Before & After";
  const galleryDescription = description?.trim() ||
    "Take a look at some of our recent work across the Bay of Plenty. Drag the sliders to compare before and after, and click any video to watch the work in action.";

  const galleryItems = useMemo(
    () =>
      (images || [])
        .map((item, index) => {
          const beforeImage = item?.before?.url ? item.before : null;
          const afterImage = item?.after?.url ? item.after : null;
          const video = item?.video?.url ? item.video : null;
          const hasBefore = !!(beforeImage && afterImage);

          if (!beforeImage && !afterImage && !video) return null;

          return {
            id: `${item?.after?.id || item?.before?.id || video?.id || "media"}-${index}`,
            hasBefore,
            video,
            data: {
              beforeImage: beforeImage || afterImage,
              afterImage: hasBefore ? afterImage : null,
            },
          };
        })
        .filter(Boolean),
    [images]
  );

  if (galleryItems.length === 0) return null;

  const activeItem = activeIndex !== null ? galleryItems[activeIndex] : null;
  const activeVideo = activeMedia === "video" ? activeItem?.video : null;
  const videoWidth = Number(activeVideo?.width);
  const videoHeight = Number(activeVideo?.height);
  const videoRatio = videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : 16 / 9;

  const openMedia = (index, media) => {
    setVideoError(false);
    setActiveMedia(media);
    setActiveIndex(index);
  };

  return (
    <section className={styles.section} id="before-after-gallery" aria-labelledby="gallery-title">
      <Container maxWidth="xl" className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.eyebrow}>Our work</div>
            <Typography variant="h2" component="h2" className={styles.title} id="gallery-title">
              {galleryTitle}
            </Typography>
          </div>

          <Typography
            variant="body1"
            component="div"
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: galleryDescription }}
          />
        </div>

        <div className={styles.grid}>
          {galleryItems.map((item, index) => {
            const media = (
              <div
                className={styles.mediaWrap}
                style={!item.data.beforeImage ? {
                  aspectRatio: `${Number(item.video?.width) || 16} / ${Number(item.video?.height) || 9}`,
                } : undefined}
              >
                {item.data.beforeImage ? <BeforeAfterMasonry data={item.data} /> : null}
              </div>
            );

            if (item.hasBefore) {
              return (
                <div key={item.id} className={`${styles.card} ${styles.comparisonCard}`}>
                  {media}
                  {item.video ? (
                    <button
                      type="button"
                      className={styles.videoTrigger}
                      onClick={() => openMedia(index, "video")}
                      aria-label={`Play gallery video ${index + 1}`}
                    >
                      <PlayArrowRoundedIcon aria-hidden="true" />
                      Watch video
                    </button>
                  ) : null}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={styles.card}
                onClick={() => openMedia(index, item.video ? "video" : "image")}
                aria-label={item.video ? `Play gallery video ${index + 1}` : `Open gallery image ${index + 1}`}
              >
                {media}
                {item.video ? (
                  <span className={styles.videoOverlay}>
                    <span className={styles.playButton}><PlayArrowRoundedIcon aria-hidden="true" /></span>
                    <span className={styles.videoLabel}>Watch video</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Container>

      <Dialog
        open={activeIndex !== null}
        onClose={() => setActiveIndex(null)}
        maxWidth="lg"
        fullWidth
        aria-label={activeVideo ? "Gallery video" : "Gallery image"}
        sx={{ zIndex: 11000 }}
        PaperProps={{
          className: styles.lightboxPaper,
          style: activeVideo ? {
            width: `min(1100px, calc((100dvh - 48px) * ${videoRatio}))`,
            maxWidth: "calc(100vw - 32px)",
            margin: "16px",
          } : undefined,
        }}
      >
        <IconButton
          className={styles.lightboxClose}
          onClick={() => setActiveIndex(null)}
          aria-label="Close gallery media"
        >
          <CloseIcon />
        </IconButton>

        <div className={activeVideo ? styles.videoLightboxBody : styles.lightboxBody}>
          {activeVideo ? (
            videoError ? (
              <div className={styles.videoError} role="alert">
                <p>This video could not be played in your browser.</p>
                <a href={activeVideo.url} target="_blank" rel="noopener noreferrer">Open video</a>
              </div>
            ) : (
              <video
                key={activeVideo.url}
                className={styles.videoPlayer}
                src={activeVideo.url}
                width={videoWidth || undefined}
                height={videoHeight || undefined}
                style={{ aspectRatio: videoRatio }}
                controls
                autoPlay
                playsInline
                preload="none"
                onError={() => setVideoError(true)}
                aria-label="Video of our work"
              />
            )
          ) : activeItem ? <BeforeAfterMasonry data={activeItem.data} priority /> : null}
        </div>
      </Dialog>
    </section>
  );
}
