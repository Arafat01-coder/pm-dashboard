import Link from "next/link";
import styles from "./Button.module.css";

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

/** A link that looks like a Button. Use for navigation instead of <Link><Button/></Link>. */
export function LinkButton({ variant = "primary", size = "md", className, ...rest }: LinkButtonProps) {
  return <Link className={`${styles.button} ${styles[variant]} ${styles[size]} ${className ?? ""}`} {...rest} />;
}
