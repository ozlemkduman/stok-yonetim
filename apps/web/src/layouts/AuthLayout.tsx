import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <h1>Stok Sayaç</h1>
          <p>Stok Yönetim Sistemi</p>
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
