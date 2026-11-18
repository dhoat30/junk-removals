import styles from "./ServiceInformationSection.module.scss";

export default function PriceExamples({ examples }) {
  if (!examples?.length) return null;
  return (
    <div className={styles.priceGuide}>
      <table className={styles.priceTable}>
        <caption>
          <strong>Junk Removals pricing guide</strong>
          <span>Plan your pickup with these indicative prices. Send us photos and your suburb for a fixed quote based on your items, materials and collection access.</span>
        </caption>
        <thead><tr><th scope="col">Collection type</th><th scope="col">Guide price</th></tr></thead>
        <tbody>
          {examples.map(example => (
            <tr key={example.item}>
              <th scope="row"><strong>{example.item}</strong><span>{example.scope}</span></th>
              <td><strong>{example.price}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.priceNote}>Prices are a guide, with the final total confirmed before work starts. Your agreed quote includes labour, loading, transport and tip fees. Tell us about heavy materials, stairs or difficult access so we can include the full job.</p>
    </div>
  );
}
