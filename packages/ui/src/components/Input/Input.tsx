import { forwardRef, type InputHTMLAttributes, type ReactNode, type WheelEvent, type KeyboardEvent } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      type,
      onWheel,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const isNumber = type === 'number';

    const handleWheel = (e: WheelEvent<HTMLInputElement>) => {
      if (isNumber) {
        (e.target as HTMLInputElement).blur();
        e.preventDefault();
      }
      onWheel?.(e);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    };

    return (
      <div
        className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      >
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`${styles.input} ${leftIcon ? styles.hasLeftIcon : ''} ${rightIcon ? styles.hasRightIcon : ''}`}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>

        {error && <span className={styles.error}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
