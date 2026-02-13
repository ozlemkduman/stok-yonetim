import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <h1>StokPro</h1>
          <p>Stok Yonetim Sistemi</p>
        </div>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
      <div className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} StokPro. Tum haklari saklidir.</p>
      </div>
    </div>
  );
}
