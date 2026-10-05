import styles from "./Card.module.css";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  action?: React.ReactNode;
  padded?: boolean;
}

export function Card({ title, action, padded = true, className, children, ...rest }: CardProps) {
  return (
    <section className={`${styles.card} ${className ?? ""}`} {...rest}>
      {(title || action) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action}
        </header>
      )}
      <div className={padded ? styles.body : undefined}>{children}</div>
    </section>
  );
}
