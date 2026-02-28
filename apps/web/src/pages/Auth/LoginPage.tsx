import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@stok/ui';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const successMessage = location.state?.message as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(formData);
      // Super admin goes to admin panel, others go to dashboard
      if (user.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.defaultError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('login.title')}</h2>
      <p className={styles.subtitle}>{t('login.subtitle')}</p>

      {successMessage && <div className={styles.success}>{successMessage}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">{t('login.emailLabel')}</label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('login.emailPlaceholder')}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">{t('login.passwordLabel')}</label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="********"
            required
          />
        </div>

        <div className={styles.forgotPassword}>
          <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? t('login.submitting') : t('login.submitButton')}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          {t('login.noAccount')}
        </p>
      </div>
    </div>
  );
}
