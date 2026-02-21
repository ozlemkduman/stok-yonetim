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
      setValidationError('Geçersiz davet linki');
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
      setValidationError(err instanceof Error ? err.message : 'Geçersiz davet linki');
    } finally {
      setIsValidating(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }
    if (!/[a-z]/.test(password)) {
      return 'Şifre en az bir küçük harf içermelidir';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Şifre en az bir büyük harf içermelidir';
    }
    if (!/\d/.test(password)) {
      return 'Şifre en az bir rakam içermelidir';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <p>Davet doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Davet Gerekli</h2>
        <p className={styles.subtitle}>
          Kayıt olmak için bir davet linkiniz olması gerekiyor.
        </p>
        <div className={styles.infoBox}>
          <p>Bu platform sadece davetli kullanıcılar içindir.</p>
          <p>Kayıt olmak için sistem yöneticinizden davet linki talep edin.</p>
        </div>
        <div className={styles.footer}>
          <p>
            Zaten hesabınız var mı?{' '}
            <Link to="/login">Giriş yapın</Link>
          </p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className={styles.page}>
        <h2 className={styles.title}>Geçersiz Davet</h2>
        <div className={styles.error}>{validationError}</div>
        <p className={styles.subtitle}>
          Davet linkinin süresi dolmuş veya daha önce kullanılmış olabilir.
        </p>
        <div className={styles.footer}>
          <p>
            Zaten hesabınız var mı?{' '}
            <Link to="/login">Giriş yapın</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Kayıt Ol</h2>
      {invitation?.isNewTenant ? (
        <p className={styles.subtitle}>
          {invitation.tenantName} organizasyonunu oluşturmak için kayıt olun
        </p>
      ) : (
        <p className={styles.subtitle}>
          {invitation?.tenantName} organizasyonuna katılmak için kayıt olun
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
          <span className={styles.hint}>E-posta adresi değiştirilemez</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="name">Ad Soyad</label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ahmet Yılmaz"
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
          <label htmlFor="password">Şifre</label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="********"
            required
          />
          <span className={styles.hint}>
            En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam
          </span>
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">Şifre Tekrar</label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Şifrenizi tekrar girin"
            required
          />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p>
          Zaten hesabınız var mı?{' '}
          <Link to="/login">Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
}
