import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '@stok/ui';
import { authApi, InvitationInfo } from '../../api/auth.api';
import styles from './AuthPages.module.css';

export function RegisterPage() {
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
      setValidationError('Gecersiz davet linki');
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
      setValidationError(err instanceof Error ? err.message : 'Gecersiz davet linki');
    } finally {
      setIsValidating(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Sifre en az 8 karakter olmalidir';
    }
    if (!/[a-z]/.test(password)) {
      return 'Sifre en az bir kucuk harf icermelidir';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Sifre en az bir buyuk harf icermelidir';
    }
    if (!/\d/.test(password)) {
      return 'Sifre en az bir rakam icermelidir';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Sifreler eslesmiyor');
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
      setError(err instanceof Error ? err.message : 'Kayit basarisiz');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <p>Davet dogrulaniyor...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Davet Gerekli</h2>
        <p className={styles.subtitle}>
          Kayit olmak icin bir davet linkiniz olmasi gerekiyor.
        </p>
        <div className={styles.infoBox}>
          <p>Bu platform sadece davetli kullanicilar icindir.</p>
          <p>Kayit olmak icin sistem yoneticinizden davet linki talep edin.</p>
        </div>
        <div className={styles.footer}>
          <p>
            Zaten hesabiniz var mi?{' '}
            <Link to="/login">Giris yapin</Link>
          </p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Gecersiz Davet</h2>
        <div className={styles.error}>{validationError}</div>
        <p className={styles.subtitle}>
          Davet linkinin suresi dolmus veya daha once kullanilmis olabilir.
        </p>
        <div className={styles.footer}>
          <p>
            Zaten hesabiniz var mi?{' '}
            <Link to="/login">Giris yapin</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Kayit Ol</h2>
      {invitation?.isNewTenant ? (
        <p className={styles.subtitle}>
          {invitation.tenantName} organizasyonunu olusturmak icin kayit olun
        </p>
      ) : (
        <p className={styles.subtitle}>
          {invitation?.tenantName} organizasyonuna katilmak icin kayit olun
        </p>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">E-posta</label>
          <Input
            id="email"
            type="email"
            value={invitation?.email || ''}
            disabled
          />
          <span className={styles.hint}>E-posta adresi degistirilemez</span>
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
            placeholder="********"
            required
          />
          <span className={styles.hint}>
            En az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam
          </span>
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
