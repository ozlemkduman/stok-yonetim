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

      <div className={styles.footer}>
        <p>
          Hesabiniz yok mu? Kayit icin davet linki gereklidir.
        </p>
      </div>
    </div>
  );
}
