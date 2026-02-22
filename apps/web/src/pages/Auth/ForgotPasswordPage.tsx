import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@stok/ui';
import { authApi } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgotPassword.defaultError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>{t('forgotPassword.success.title')}</h2>
        <p className={styles.subtitle}>
          {t('forgotPassword.success.subtitle')}
        </p>
        <div className={styles.footer}>
          <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('forgotPassword.title')}</h2>
      <p className={styles.subtitle}>
        {t('forgotPassword.subtitle')}
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">{t('forgotPassword.emailLabel')}</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgotPassword.emailPlaceholder')}
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? t('forgotPassword.submitting') : t('forgotPassword.submitButton')}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
