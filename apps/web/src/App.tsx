import { AppRouter } from './router';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
