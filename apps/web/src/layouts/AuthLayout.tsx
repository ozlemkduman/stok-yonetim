import { Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Logo size="lg" subtitle="Stok Yönetim Sistemi" />
        </div>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
      <div className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Stok Sayaç. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}
