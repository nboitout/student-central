import type { FitSignal } from "@/lib/types";
import styles from "./FitSignalBadge.module.css";

interface Props {
  signal: FitSignal | null;
  size?: "sm" | "md" | "lg";
}

const LABELS: Record<FitSignal, string> = {
  "Strong fit":      "Strong fit",
  "Partial fit":     "Partial fit",
  "Poor fit":        "Poor fit",
  "Needs more info": "Needs more info",
};

const CLASS_MAP: Record<FitSignal, string> = {
  "Strong fit":      styles.strong,
  "Partial fit":     styles.partial,
  "Poor fit":        styles.poor,
  "Needs more info": styles.unknown,
};

export default function FitSignalBadge({ signal, size = "md" }: Props) {
  if (!signal) return <span className={`${styles.badge} ${styles.none} ${styles[size]}`}>No signal yet</span>;
  return (
    <span className={`${styles.badge} ${CLASS_MAP[signal]} ${styles[size]}`}>
      {LABELS[signal]}
    </span>
  );
}
