import { useEffect, type ReactNode } from 'react';
import styles from './HelpDrawer.module.css';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function HelpDrawer({ isOpen, onClose, title, children }: HelpDrawerProps) {
  // ESC ile kapansın
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        aria-hidden={!isOpen}
        role="complementary"
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.icon} aria-hidden="true">?</span>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Kapat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
