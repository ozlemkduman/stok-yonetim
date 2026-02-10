import { type ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {children}
    </span>
  );
}
