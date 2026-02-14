import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '@stok/ui';
import styles from './AuthPages.module.css';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Store tokens and redirect to dashboard
      setTokens(accessToken, refreshToken);
      navigate('/', { replace: true });
    } else {
      // Error - redirect to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setTokens]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Giris yapiliyor...</p>
        </div>
      </div>
    </div>
  );
}
