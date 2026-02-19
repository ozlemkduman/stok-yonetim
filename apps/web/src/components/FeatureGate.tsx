import { Spinner } from '@stok/ui';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { hasFeature, isLoading } = useTenant();
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

  if (!hasFeature(feature)) {
    return <UpgradePrompt />;
  }

  return <>{children}</>;
}
