import { useNavigate } from 'react-router-dom';
import { Button } from '@stok/ui';
import styles from './UpgradePrompt.module.css';

interface UpgradePromptProps {
  variant?: 'page' | 'inline';
  title?: string;
  message?: string;
}

export function UpgradePrompt({
  variant = 'page',
  title = 'Planınızı Yükseltin',
  message = 'Bu özellik mevcut planınızda bulunmuyor. Daha fazla özellik ve limit için planınızı yükseltin.',
}: UpgradePromptProps) {
  const navigate = useNavigate();

  if (variant === 'inline') {
    return (
      <div className={styles.inline}>
        <span className={styles.inlineIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </span>
        <span className={styles.inlineText}>{message}</span>
        <Button size="sm" variant="primary" onClick={() => navigate('/settings')}>
          Plani Yukselt
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <Button variant="primary" onClick={() => navigate('/settings')}>
          Planlari Gor
        </Button>
      </div>
    </div>
  );
}
