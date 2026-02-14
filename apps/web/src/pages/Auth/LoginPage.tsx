import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input } from '@stok/ui';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPages.module.css';

export function LoginPage() {
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
      setError(err instanceof Error ? err.message : 'Giris basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Giris Yap</h2>
      <p className={styles.subtitle}>Hesabiniza erisim saglayin</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">E-posta</label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ornek@sirket.com"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Sifre</label>
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
          <Link to="/forgot-password">Sifremi unuttum</Link>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>veya</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/google`;
        }}
        className={styles.googleButton}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className={styles.googleIcon}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google ile Giris Yap
      </Button>

      <div className={styles.footer}>
        <p>
          Hesabiniz yok mu?{' '}
          <Link to="/register">Ucretsiz kayit olun</Link>
        </p>
      </div>
    </div>
  );
}
