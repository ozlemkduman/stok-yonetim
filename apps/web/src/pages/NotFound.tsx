import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>404</h1>
      <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        Sayfa bulunamadi
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
        Ana Sayfaya Don
      </Link>
    </div>
  );
}
