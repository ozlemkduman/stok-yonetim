import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '24px',
          backgroundColor: 'var(--color-bg, #f9fafb)',
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '16px',
            lineHeight: 1,
          }}>500</div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-text, #1a1a2e)',
            marginBottom: '8px',
          }}>
            Beklenmeyen bir hata olustu
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-secondary, #6b7280)',
            marginBottom: '24px',
            maxWidth: '400px',
          }}>
            Bir sorun olustu. Lutfen sayfayi yenileyin veya ana sayfaya donun.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              maxWidth: '600px',
              overflow: 'auto',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--color-primary, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Tekrar Dene
            </button>
            <Link
              to="/dashboard"
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                color: 'var(--color-primary, #4f46e5)',
                border: '1px solid var(--color-primary, #4f46e5)',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Ana Sayfaya Don
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
