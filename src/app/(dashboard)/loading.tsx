import { Spinner } from "@/components/ui";
import styles from "./pages.module.css";

export default function Loading() {
  return (
    <div className={styles.centered}>
      <Spinner size={28} />
    </div>
  );
}
