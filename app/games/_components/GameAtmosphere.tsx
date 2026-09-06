import type { ReactNode } from "react";
import styles from "./GameAtmosphere.module.css";

export type GameAtmosphereVariant = "library" | "social" | "deduction" | "cards" | "trivia" | "sports";

export function GameAtmosphere({ variant, children }: { variant: GameAtmosphereVariant; children: ReactNode }) {
  return (
    <div className={`${styles.shell} ${styles[variant]}`}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.glowA} />
        <div className={styles.glowB} />
        <div className={styles.glowC} />
        <div className={styles.orbit} />
        <div className={styles.sparkField} />
        <div className={styles.vignette} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
