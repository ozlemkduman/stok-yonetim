import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Logo size="lg" subtitle={t('layout.subtitle')} />
        </div>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
      <div className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} {t('layout.copyright')}</p>
      </div>
    </div>
  );
}
