import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@stok/ui';
import { authApi } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function ForgotPasswordPage() {
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
      setError(err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>E-posta Gonderildi</h2>
        <p className={styles.subtitle}>
          Sifre sifirlama baglantisi e-posta adresinize gonderildi.
          Lutfen gelen kutunuzu kontrol edin.
        </p>
        <div className={styles.footer}>
          <Link to="/login">Giris sayfasina don</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Sifremi Unuttum</h2>
      <p className={styles.subtitle}>
        E-posta adresinizi girin, size sifre sifirlama baglantisi gonderelim.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">E-posta</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@sirket.com"
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Gonderiliyor...' : 'Sifirlama Baglantisi Gonder'}
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
