import styles from "./BlackwoodAtmosphere.module.css";

export function BlackwoodAtmosphere() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.windowGlow} />
      <div className={styles.fogA} />
      <div className={styles.fogB} />
      <div className={styles.rain} />
      <div className={styles.candleA} />
      <div className={styles.candleB} />
      <div className={styles.vignette} />
    </div>
  );
}
