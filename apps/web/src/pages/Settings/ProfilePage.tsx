import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@stok/ui';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import styles from './SettingsPages.module.css';

export function ProfilePage() {
  const { t } = useTranslation(['settings', 'common']);
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
      setError(t('settings:profile.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError(t('settings:profile.passwordTooShort'));
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage(t('settings:profile.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings:profile.passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t('settings:profile.title')}</h1>

      <div className={styles.grid}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings:profile.accountInfo')}</h2>
          <dl className={styles.detailList}>
            <dt>{t('settings:profile.fullName')}</dt>
            <dd>{user?.name}</dd>

            <dt>{t('settings:profile.email')}</dt>
            <dd>{user?.email}</dd>

            <dt>{t('settings:profile.role')}</dt>
            <dd>{user?.role}</dd>

            <dt>{t('settings:profile.company')}</dt>
            <dd>{user?.tenant?.name || '-'}</dd>
          </dl>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings:profile.changePassword')}</h2>

          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.field}>
              <label>{t('settings:profile.currentPassword')}</label>
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
              <label>{t('settings:profile.newPassword')}</label>
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
              <label>{t('settings:profile.confirmPassword')}</label>
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
              {isChangingPassword ? t('settings:profile.changingPassword') : t('settings:profile.changePasswordButton')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
