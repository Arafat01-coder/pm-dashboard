import { useId } from "react";
import inputStyles from "./Input.module.css";
import styles from "./Textarea.module.css";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hideLabel?: boolean;
}

export function Textarea({ label, error, hideLabel, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <div className={`${inputStyles.field} ${className ?? ""}`}>
      <label htmlFor={textareaId} className={hideLabel ? "sr-only" : inputStyles.label}>
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`${inputStyles.input} ${styles.textarea} ${error ? inputStyles.invalid : ""}`}
        aria-invalid={!!error || undefined}
        {...rest}
      />
      {error && <p className={inputStyles.error}>{error}</p>}
    </div>
  );
}
