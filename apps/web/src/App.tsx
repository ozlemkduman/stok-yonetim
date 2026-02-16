import { AppRouter } from './router';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <AppRouter />
            </ConfirmDialogProvider>
          </ToastProvider>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
