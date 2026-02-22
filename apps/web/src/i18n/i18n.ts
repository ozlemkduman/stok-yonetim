import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import trCommon from './locales/tr/common.json';
import trNav from './locales/tr/nav.json';
import trLanding from './locales/tr/landing.json';
import trAuth from './locales/tr/auth.json';
import trDashboard from './locales/tr/dashboard.json';
import trSales from './locales/tr/sales.json';
import trProducts from './locales/tr/products.json';
import trCustomers from './locales/tr/customers.json';
import trReturns from './locales/tr/returns.json';
import trExpenses from './locales/tr/expenses.json';
import trAccounts from './locales/tr/accounts.json';
import trWarehouses from './locales/tr/warehouses.json';
import trQuotes from './locales/tr/quotes.json';
import trEdocuments from './locales/tr/edocuments.json';
import trReports from './locales/tr/reports.json';
import trSettings from './locales/tr/settings.json';
import trAdmin from './locales/tr/admin.json';
import trCrm from './locales/tr/crm.json';
import trFieldteam from './locales/tr/fieldteam.json';
import trIntegrations from './locales/tr/integrations.json';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enSales from './locales/en/sales.json';
import enProducts from './locales/en/products.json';
import enCustomers from './locales/en/customers.json';
import enReturns from './locales/en/returns.json';
import enExpenses from './locales/en/expenses.json';
import enAccounts from './locales/en/accounts.json';
import enWarehouses from './locales/en/warehouses.json';
import enQuotes from './locales/en/quotes.json';
import enEdocuments from './locales/en/edocuments.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enAdmin from './locales/en/admin.json';
import enCrm from './locales/en/crm.json';
import enFieldteam from './locales/en/fieldteam.json';
import enIntegrations from './locales/en/integrations.json';

const ns = [
  'common', 'nav', 'landing', 'auth', 'dashboard', 'sales', 'products',
  'customers', 'returns', 'expenses', 'accounts', 'warehouses', 'quotes',
  'edocuments', 'reports', 'settings', 'admin', 'crm', 'fieldteam', 'integrations',
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        common: trCommon, nav: trNav, landing: trLanding, auth: trAuth,
        dashboard: trDashboard, sales: trSales, products: trProducts,
        customers: trCustomers, returns: trReturns, expenses: trExpenses,
        accounts: trAccounts, warehouses: trWarehouses, quotes: trQuotes,
        edocuments: trEdocuments, reports: trReports, settings: trSettings,
        admin: trAdmin, crm: trCrm, fieldteam: trFieldteam, integrations: trIntegrations,
      },
      en: {
        common: enCommon, nav: enNav, landing: enLanding, auth: enAuth,
        dashboard: enDashboard, sales: enSales, products: enProducts,
        customers: enCustomers, returns: enReturns, expenses: enExpenses,
        accounts: enAccounts, warehouses: enWarehouses, quotes: enQuotes,
        edocuments: enEdocuments, reports: enReports, settings: enSettings,
        admin: enAdmin, crm: enCrm, fieldteam: enFieldteam, integrations: enIntegrations,
      },
    },
    fallbackLng: 'tr',
    defaultNS: 'common',
    ns: [...ns],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
  });

export default i18n;
