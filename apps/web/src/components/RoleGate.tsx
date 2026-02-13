import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, UserRole } from '../hooks/usePermissions';

interface RoleGateProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGate({ children, roles, fallback, redirectTo }: RoleGateProps) {
  const { hasAnyRole } = usePermissions();

  if (!hasAnyRole(...roles)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Erişim Reddedildi</h2>
        <p>Bu sayfayı görüntülemek için yetkiniz bulunmuyor.</p>
      </div>
    );
  }

  return <>{children}</>;
}
