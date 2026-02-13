import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@stok/ui';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      await register({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayit basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Kayit Ol</h2>
      <p className={styles.subtitle}>14 gun ucretsiz deneyin</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="companyName">Sirket Adi</label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Sirket Ltd. Sti."
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="name">Ad Soyad</label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ahmet Yilmaz"
            required
          />
        </div>

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
          <label htmlFor="phone">Telefon (Opsiyonel)</label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0532 111 22 33"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Sifre</label>
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
          {isLoading ? 'Kayit yapiliyor...' : 'Kayit Ol'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          Zaten hesabiniz var mi?{' '}
          <Link to="/login">Giris yapin</Link>
        </p>
      </div>
    </div>
  );
}
