import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGate } from './components/RoleGate';
import { FeatureGate } from './components/FeatureGate';
import { USER_ROLES } from './hooks/usePermissions';

// Auth Pages
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, GoogleCallbackPage } from './pages/Auth';

// Admin Pages
import {
  AdminDashboardPage,
  TenantsListPage,
  TenantDetailPage,
  TenantFormPage,
  PlansListPage,
  AdminUsersPage,
  UserFormPage,
  ActivityLogsPage,
  InvitationsPage,
} from './pages/Admin';

// Settings Pages
import { TenantSettingsPage, UserManagementPage, ProfilePage } from './pages/Settings';

// Main App Pages
import { DashboardPage } from './pages/Dashboard';
import { CustomerListPage, CustomerDetailPage } from './pages/Customers';
import { ProductListPage, ProductDetailPage } from './pages/Products';
import { SaleListPage, SaleDetailPage, SaleFormPage, InvoiceImportPage } from './pages/Sales';
import { ReturnListPage, ReturnDetailPage, ReturnFormPage } from './pages/Returns';
import { ExpenseListPage } from './pages/Expenses';
import { ReportsPage } from './pages/Reports';
import { AccountListPage, AccountDetailPage } from './pages/Accounts';
import { WarehouseListPage, WarehouseDetailPage, StockTransferPage, StockMovementsPage } from './pages/Warehouses';
import { QuoteListPage, QuoteDetailPage, QuoteFormPage, QuotePrintView } from './pages/Quotes';
import { EDocumentListPage, EDocumentDetailPage } from './pages/EDocuments';
import { IntegrationListPage, IntegrationDetailPage, ECommerceOrdersPage, BankStatementsPage } from './pages/Integrations';
import { ContactListPage, ContactDetailPage } from './pages/CRM';
import { RouteListPage, RouteDetailPage, RoutePlannerPage } from './pages/FieldTeam';
import { NotFoundPage } from './pages/NotFound';

export function AppRouter() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      </Route>

      {/* Admin Routes - Super Admin Only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGate roles={[USER_ROLES.SUPER_ADMIN]} redirectTo="/dashboard">
              <AdminLayout />
            </RoleGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="tenants" element={<TenantsListPage />} />
        <Route path="tenants/new" element={<TenantFormPage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="tenants/:id/edit" element={<TenantFormPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
        <Route path="invitations" element={<InvitationsPage />} />
        <Route path="logs" element={<ActivityLogsPage />} />
      </Route>

      {/* Main App Routes - Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Settings */}
        <Route path="settings" element={<TenantSettingsPage />} />
        <Route path="settings/users" element={<UserManagementPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />

        {/* Products */}
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />

        {/* Quotes */}
        <Route path="quotes" element={<FeatureGate feature="quotes"><QuoteListPage /></FeatureGate>} />
        <Route path="quotes/new" element={<FeatureGate feature="quotes"><QuoteFormPage /></FeatureGate>} />
        <Route path="quotes/:id" element={<FeatureGate feature="quotes"><QuoteDetailPage /></FeatureGate>} />
        <Route path="quotes/:id/edit" element={<FeatureGate feature="quotes"><QuoteFormPage /></FeatureGate>} />
        <Route path="quotes/:id/print" element={<FeatureGate feature="quotes"><QuotePrintView /></FeatureGate>} />

        {/* Sales */}
        <Route path="sales" element={<SaleListPage />} />
        <Route path="sales/new" element={<SaleFormPage />} />
        <Route path="sales/import" element={<FeatureGate feature="invoiceImport"><InvoiceImportPage /></FeatureGate>} />
        <Route path="sales/:id" element={<SaleDetailPage />} />

        {/* Returns */}
        <Route path="returns" element={<ReturnListPage />} />
        <Route path="returns/new" element={<ReturnFormPage />} />
        <Route path="returns/:id" element={<ReturnDetailPage />} />

        {/* Expenses */}
        <Route path="expenses" element={<ExpenseListPage />} />

        {/* Accounts */}
        <Route path="accounts" element={<AccountListPage />} />
        <Route path="accounts/:id" element={<AccountDetailPage />} />

        {/* Warehouses */}
        <Route path="warehouses" element={<FeatureGate feature="warehouses"><WarehouseListPage /></FeatureGate>} />
        <Route path="warehouses/transfers" element={<FeatureGate feature="warehouses"><StockTransferPage /></FeatureGate>} />
        <Route path="warehouses/movements" element={<FeatureGate feature="warehouses"><StockMovementsPage /></FeatureGate>} />
        <Route path="warehouses/:id" element={<FeatureGate feature="warehouses"><WarehouseDetailPage /></FeatureGate>} />

        {/* E-Documents */}
        <Route path="e-documents" element={<FeatureGate feature="eDocuments"><EDocumentListPage /></FeatureGate>} />
        <Route path="e-documents/:id" element={<FeatureGate feature="eDocuments"><EDocumentDetailPage /></FeatureGate>} />

        {/* Integrations */}
        <Route path="integrations" element={<FeatureGate feature="integrations"><IntegrationListPage /></FeatureGate>} />
        <Route path="integrations/e-commerce-orders" element={<FeatureGate feature="integrations"><ECommerceOrdersPage /></FeatureGate>} />
        <Route path="integrations/bank-statements" element={<FeatureGate feature="integrations"><BankStatementsPage /></FeatureGate>} />
        <Route path="integrations/:id" element={<FeatureGate feature="integrations"><IntegrationDetailPage /></FeatureGate>} />

        {/* CRM */}
        <Route path="crm" element={<FeatureGate feature="crm"><ContactListPage /></FeatureGate>} />
        <Route path="crm/:id" element={<FeatureGate feature="crm"><ContactDetailPage /></FeatureGate>} />

        {/* Field Team */}
        <Route path="field-team" element={<FeatureGate feature="fieldTeam"><RouteListPage /></FeatureGate>} />
        <Route path="field-team/planner" element={<FeatureGate feature="fieldTeam"><RoutePlannerPage /></FeatureGate>} />
        <Route path="field-team/:id" element={<FeatureGate feature="fieldTeam"><RouteDetailPage /></FeatureGate>} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
