import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard';
import { CustomerListPage, CustomerDetailPage } from './pages/Customers';
import { ProductListPage } from './pages/Products';
import { SaleListPage } from './pages/Sales';
import { ReturnListPage } from './pages/Returns';
import { ExpenseListPage } from './pages/Expenses';
import { ReportsPage } from './pages/Reports';
import { AccountListPage } from './pages/Accounts';
import { WarehouseListPage } from './pages/Warehouses';
import { QuoteListPage } from './pages/Quotes';
import { EDocumentListPage } from './pages/EDocuments';
import { IntegrationListPage } from './pages/Integrations';
import { ContactListPage } from './pages/CRM';
import { RouteListPage } from './pages/FieldTeam';
import { NotFoundPage } from './pages/NotFound';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="quotes" element={<QuoteListPage />} />
        <Route path="sales" element={<SaleListPage />} />
        <Route path="returns" element={<ReturnListPage />} />
        <Route path="expenses" element={<ExpenseListPage />} />
        <Route path="accounts" element={<AccountListPage />} />
        <Route path="warehouses" element={<WarehouseListPage />} />
        <Route path="e-documents" element={<EDocumentListPage />} />
        <Route path="integrations" element={<IntegrationListPage />} />
        <Route path="crm" element={<ContactListPage />} />
        <Route path="field-team" element={<RouteListPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
