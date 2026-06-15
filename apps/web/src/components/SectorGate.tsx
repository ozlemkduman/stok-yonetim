import { Spinner } from '@stok/ui';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { NotFoundPage } from '../pages/NotFound';

interface SectorGateProps {
  sector: string;
  children: React.ReactNode;
}

/**
 * Sektöre özel sayfaları korur. Tenant'ın business_type'ı eşleşmiyorsa
 * (ve kullanıcı super_admin değilse) sayfayı gizler — plan değil sektör meselesi
 * olduğu için UpgradePrompt yerine 404 gösterir.
 */
export function SectorGate({ sector, children }: SectorGateProps) {
  const { hasSector, isLoading } = useTenant();
  const { user } = useAuth();

  // super_admin bypass
  if (user?.role === 'super_admin') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasSector(sector)) {
    return <NotFoundPage />;
  }

  return <>{children}</>;
}
