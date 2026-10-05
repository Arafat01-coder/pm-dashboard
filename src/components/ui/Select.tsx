import { useId } from "react";
import inputStyles from "./Input.module.css";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  options: SelectOption[];
  /** Adds an empty first option, e.g. "Any status" or "Unassigned". */
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, placeholder, error, id, className, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const select = (
    <select
      id={selectId}
      className={`${inputStyles.input} ${styles.select} ${error ? inputStyles.invalid : ""} ${label ? "" : (className ?? "")}`}
      aria-invalid={!!error || undefined}
      aria-label={label ? undefined : rest["aria-label"]}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (!label) return select;

  return (
    <div className={`${inputStyles.field} ${className ?? ""}`}>
      <label htmlFor={selectId} className={inputStyles.label}>
        {label}
      </label>
      {select}
      {error && <p className={inputStyles.error}>{error}</p>}
    </div>
  );
}
