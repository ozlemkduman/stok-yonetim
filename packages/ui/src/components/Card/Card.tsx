import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div className={`${styles.card} ${className}`} {...props}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
        </div>
      )}

      <div className={`${styles.body} ${styles[`padding-${padding}`]}`}>
        {children}
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
