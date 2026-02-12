import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard';
import { CustomerListPage, CustomerDetailPage } from './pages/Customers';
import { ProductListPage, ProductDetailPage } from './pages/Products';
import { SaleListPage, SaleDetailPage } from './pages/Sales';
import { ReturnListPage, ReturnDetailPage } from './pages/Returns';
import { ExpenseListPage } from './pages/Expenses';
import { ReportsPage } from './pages/Reports';
import { AccountListPage, AccountDetailPage } from './pages/Accounts';
import { WarehouseListPage, WarehouseDetailPage } from './pages/Warehouses';
import { QuoteListPage, QuoteDetailPage } from './pages/Quotes';
import { EDocumentListPage, EDocumentDetailPage } from './pages/EDocuments';
import { IntegrationListPage, IntegrationDetailPage } from './pages/Integrations';
import { ContactListPage, ContactDetailPage } from './pages/CRM';
import { RouteListPage, RouteDetailPage } from './pages/FieldTeam';
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
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="quotes" element={<QuoteListPage />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="sales" element={<SaleListPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />
        <Route path="returns" element={<ReturnListPage />} />
        <Route path="returns/:id" element={<ReturnDetailPage />} />
        <Route path="expenses" element={<ExpenseListPage />} />
        <Route path="accounts" element={<AccountListPage />} />
        <Route path="accounts/:id" element={<AccountDetailPage />} />
        <Route path="warehouses" element={<WarehouseListPage />} />
        <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="e-documents" element={<EDocumentListPage />} />
        <Route path="e-documents/:id" element={<EDocumentDetailPage />} />
        <Route path="integrations" element={<IntegrationListPage />} />
        <Route path="integrations/:id" element={<IntegrationDetailPage />} />
        <Route path="crm" element={<ContactListPage />} />
        <Route path="crm/:id" element={<ContactDetailPage />} />
        <Route path="field-team" element={<RouteListPage />} />
        <Route path="field-team/:id" element={<RouteDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
