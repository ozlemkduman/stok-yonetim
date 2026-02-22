import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '@stok/ui';
import styles from './AuthPages.module.css';

export function GoogleCallbackPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (accessToken && refreshToken) {
        // Store tokens and get user
        const user = await setTokens(accessToken, refreshToken);
        // Super admin goes to admin panel, others go to dashboard
        if (user?.role === 'super_admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // Error - redirect to login
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setTokens]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>{t('googleCallback.loading')}</p>
        </div>
      </div>
    </div>
  );
}
