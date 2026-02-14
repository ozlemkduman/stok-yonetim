import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGate } from './components/RoleGate';
import { USER_ROLES } from './hooks/usePermissions';

// Auth Pages
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, GoogleCallbackPage } from './pages/Auth';

// Admin Pages
import {
  AdminDashboardPage,
  TenantsListPage,
  TenantDetailPage,
  PlansListPage,
  AdminUsersPage,
  ActivityLogsPage,
} from './pages/Admin';

// Settings Pages
import { TenantSettingsPage, UserManagementPage, ProfilePage } from './pages/Settings';

// Main App Pages
import { DashboardPage } from './pages/Dashboard';
import { CustomerListPage, CustomerDetailPage } from './pages/Customers';
import { ProductListPage, ProductDetailPage } from './pages/Products';
import { SaleListPage, SaleDetailPage, SaleFormPage } from './pages/Sales';
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
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="plans" element={<PlansListPage />} />
        <Route path="users" element={<AdminUsersPage />} />
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
        <Route path="quotes" element={<QuoteListPage />} />
        <Route path="quotes/new" element={<QuoteFormPage />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="quotes/:id/edit" element={<QuoteFormPage />} />
        <Route path="quotes/:id/print" element={<QuotePrintView />} />

        {/* Sales */}
        <Route path="sales" element={<SaleListPage />} />
        <Route path="sales/new" element={<SaleFormPage />} />
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
        <Route path="warehouses" element={<WarehouseListPage />} />
        <Route path="warehouses/transfers" element={<StockTransferPage />} />
        <Route path="warehouses/movements" element={<StockMovementsPage />} />
        <Route path="warehouses/:id" element={<WarehouseDetailPage />} />

        {/* E-Documents */}
        <Route path="e-documents" element={<EDocumentListPage />} />
        <Route path="e-documents/:id" element={<EDocumentDetailPage />} />

        {/* Integrations */}
        <Route path="integrations" element={<IntegrationListPage />} />
        <Route path="integrations/e-commerce-orders" element={<ECommerceOrdersPage />} />
        <Route path="integrations/bank-statements" element={<BankStatementsPage />} />
        <Route path="integrations/:id" element={<IntegrationDetailPage />} />

        {/* CRM */}
        <Route path="crm" element={<ContactListPage />} />
        <Route path="crm/:id" element={<ContactDetailPage />} />

        {/* Field Team */}
        <Route path="field-team" element={<RouteListPage />} />
        <Route path="field-team/planner" element={<RoutePlannerPage />} />
        <Route path="field-team/:id" element={<RouteDetailPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
