import Image from "next/image";
import { ReactCompareSlider } from "react-compare-slider";
import styles from "./BeforeAfterMasonry.module.scss";

export default function BeforeAfterMasonry({ data, priority }) {
  if (!data.beforeImage) return null;

  return (
    <div>
      {data.afterImage ? (
        <div className={styles.comparison}>
          <ReactCompareSlider
            className="image-wrapper"
            onlyHandleDraggable
            style={{
              paddingBottom: `${(data.beforeImage.height / data.beforeImage.width) * 100}%`,
              touchAction: "pan-y",
            }}
            itemOne={
              <Image
                src={data.beforeImage.url}
                alt={data.beforeImage.alt ? data.beforeImage.alt : "Before"}
                priority={priority}
                fill
              />
            }
            itemTwo={
              <Image
                src={data.afterImage.url}
                alt={data.afterImage.alt ? data.afterImage.alt : "After"}
                fill
                priority={priority}
              />
            }
          />

          <span className={`${styles.label} ${styles.beforeLabel}`}>Before</span>
          <span className={`${styles.label} ${styles.afterLabel}`}>After</span>
        </div>
      ) : (
        <div
          className="image-wrapper"
          style={{
            paddingBottom: `${(data.beforeImage.height / data.beforeImage.width) * 100}%`,
          }}
        >
          <Image
            src={data.beforeImage.url}
            alt={data.beforeImage.alt ? data.beforeImage.alt : "Completed work"}
            fill
            priority={priority}
          />
        </div>
      )}
    </div>
  );
}
