import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@stok/ui';
import { authApi, InvitationInfo } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError(t('register.invalidInviteLink'));
      setIsValidating(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);
      const response = await authApi.validateInvitation(token!);
      setInvitation(response.data);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : t('register.invalidInviteLink'));
    } finally {
      setIsValidating(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return t('register.validation.passwordMinLength');
    }
    if (!/[a-z]/.test(password)) {
      return t('register.validation.passwordLowercase');
    }
    if (!/[A-Z]/.test(password)) {
      return t('register.validation.passwordUppercase');
    }
    if (!/\d/.test(password)) {
      return t('register.validation.passwordDigit');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.validation.passwordsDoNotMatch'));
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.registerWithInvitation({
        token: token!,
        name: formData.name,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.defaultError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <p>{t('register.validatingInvitation')}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>{t('register.inviteRequired.title')}</h2>
        <p className={styles.subtitle}>
          {t('register.inviteRequired.subtitle')}
        </p>
        <div className={styles.infoBox}>
          <p>{t('register.inviteRequired.info1')}</p>
          <p>{t('register.inviteRequired.info2')}</p>
        </div>
        <div className={styles.footer}>
          <p>
            {t('register.hasAccount')}{' '}
            <Link to="/login">{t('register.loginLink')}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>{t('register.invalidInvite.title')}</h2>
        <div className={styles.error}>{validationError}</div>
        <p className={styles.subtitle}>
          {t('register.invalidInvite.subtitle')}
        </p>
        <div className={styles.footer}>
          <p>
            {t('register.hasAccount')}{' '}
            <Link to="/login">{t('register.loginLink')}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('register.title')}</h2>
      {invitation?.isNewTenant ? (
        <p className={styles.subtitle}>
          {t('register.subtitleCreate', { tenantName: invitation.tenantName })}
        </p>
      ) : (
        <p className={styles.subtitle}>
          {t('register.subtitleJoin', { tenantName: invitation?.tenantName })}
        </p>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">{t('register.emailLabel')}</label>
          <Input
            id="email"
            type="email"
            value={invitation?.email || ''}
            disabled
          />
          <span className={styles.hint}>{t('register.emailHint')}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="name">{t('register.nameLabel')}</label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('register.namePlaceholder')}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="phone">{t('register.phoneLabel')}</label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={t('register.phonePlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">{t('register.passwordLabel')}</label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="********"
            required
          />
          <span className={styles.hint}>
            {t('register.passwordHint')}
          </span>
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder={t('register.confirmPasswordPlaceholder')}
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? t('register.submitting') : t('register.submitButton')}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          {t('register.hasAccount')}{' '}
          <Link to="/login">{t('register.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
