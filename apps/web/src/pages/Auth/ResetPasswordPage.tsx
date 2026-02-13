import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input } from '@stok/ui';
import { authApi } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function ResetPasswordPage() {
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
        <h2 className={styles.title}>Gecersiz Baglanti</h2>
        <p className={styles.subtitle}>
          Sifre sifirlama baglantisi gecersiz veya suresi dolmus.
        </p>
        <div className={styles.footer}>
          <Link to="/forgot-password">Yeni baglanti isteyin</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Sifreler eslesmiyor');
      return;
    }

    if (formData.password.length < 8) {
      setError('Sifre en az 8 karakter olmalidir');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, formData.password);
      navigate('/login', {
        state: { message: 'Sifreniz basariyla degistirildi. Giris yapabilirsiniz.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Yeni Sifre Belirle</h2>
      <p className={styles.subtitle}>Yeni sifrenizi girin</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="password">Yeni Sifre</label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="En az 8 karakter"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">Sifre Tekrar</label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Sifrenizi tekrar girin"
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : 'Sifreyi Degistir'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          <Link to="/login">Giris sayfasina don</Link>
        </p>
      </div>
    </div>
  );
}
