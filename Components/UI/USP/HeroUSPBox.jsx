import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import styles from "./HeroUSP.module.scss";

export default function HeroUSPBox({ data, className = "", twoColumnsGrid, leftAligned = false }) {
  if (!data?.text_usp?.length) return null;

  return (
    <div className={`${className} ${styles.textUspContainerBox}`}>
      <ul
        className={`${styles.textUspWrapper} ${twoColumnsGrid ? styles.twoColumnsGrid : ""} ${leftAligned ? styles.leftAligned : ""}`}
        aria-label="Why choose Junk Removals"
      >
        {data.text_usp.map((item, index) => (
          <li className={styles.textUSP} key={index}>
            <span className={styles.iconBadge} aria-hidden="true">
              <CheckRoundedIcon className={styles.icon} />
            </span>
            <Typography component="span" className={styles.benefitText}>
              {item.value}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  );
}
