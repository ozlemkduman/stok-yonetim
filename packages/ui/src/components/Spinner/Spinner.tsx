import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'secondary';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
      role="status"
      aria-label="Yukleniyor"
    />
  );
}
