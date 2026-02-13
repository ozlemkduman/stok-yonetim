import { useState } from 'react';
import { Card, Button, Input } from '@stok/ui';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import styles from './SettingsPages.module.css';

export function ProfilePage() {
  const { user } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Yeni sifreler eslesmiyor');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Yeni sifre en az 8 karakter olmalidir');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('Sifreniz basariyla degistirildi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sifre degistirilemedi');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Profil</h1>

      <div className={styles.grid}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Hesap Bilgileri</h2>
          <dl className={styles.detailList}>
            <dt>Ad Soyad</dt>
            <dd>{user?.name}</dd>

            <dt>E-posta</dt>
            <dd>{user?.email}</dd>

            <dt>Rol</dt>
            <dd>{user?.role}</dd>

            <dt>Sirket</dt>
            <dd>{user?.tenant?.name || '-'}</dd>
          </dl>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Sifre Degistir</h2>

          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.field}>
              <label>Mevcut Sifre</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.field}>
              <label>Yeni Sifre</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
                minLength={8}
              />
            </div>

            <div className={styles.field}>
              <label>Yeni Sifre Tekrar</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}

            <Button type="submit" variant="primary" disabled={isChangingPassword}>
              {isChangingPassword ? 'Degistiriliyor...' : 'Sifreyi Degistir'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
