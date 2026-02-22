import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>{t('admin:notFound.title')}</h1>
      <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        {t('admin:notFound.message')}
      </p>
      <Link
        to="/dashboard"
        style={{
          padding: 'var(--space-3) var(--space-6)',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
        }}
      >
        {t('admin:notFound.goHome')}
      </Link>
    </div>
  );
}
