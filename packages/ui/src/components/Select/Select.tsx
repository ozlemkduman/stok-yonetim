import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div
        className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      >
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}

        <div className={`${styles.selectWrapper} ${error ? styles.hasError : ''}`}>
          <select
            ref={ref}
            id={selectId}
            className={styles.select}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.arrow}>▼</span>
        </div>

        {error && <span className={styles.error}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
