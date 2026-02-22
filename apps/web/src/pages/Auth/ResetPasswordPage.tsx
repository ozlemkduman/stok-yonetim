import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@stok/ui';
import { authApi } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>{t('resetPassword.invalidLink.title')}</h2>
        <p className={styles.subtitle}>
          {t('resetPassword.invalidLink.subtitle')}
        </p>
        <div className={styles.footer}>
          <Link to="/forgot-password">{t('resetPassword.invalidLink.requestNew')}</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('resetPassword.validation.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('resetPassword.validation.passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, formData.password);
      navigate('/login', {
        state: { message: t('resetPassword.successMessage') },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.defaultError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('resetPassword.title')}</h2>
      <p className={styles.subtitle}>{t('resetPassword.subtitle')}</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="password">{t('resetPassword.passwordLabel')}</label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('resetPassword.passwordPlaceholder')}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? t('resetPassword.submitting') : t('resetPassword.submitButton')}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          <Link to="/login">{t('resetPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
