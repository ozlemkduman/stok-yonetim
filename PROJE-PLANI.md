# 📦 Stok Yönetim Sistemi — Proje Planı

## Teknoloji Kararları

| Katman | Teknoloji |
|---|---|
| Monorepo | pnpm workspaces |
| Backend | NestJS + TypeScript |
| Veritabanı | PostgreSQL |
| DB Bağlantısı & Migration | Knex.js |
| Frontend | React 18 + Vite + TypeScript |
| UI Bileşenleri | `@stok/ui` shared components paketi |
| Tema | CSS custom properties (variables) |
| CI | GitHub Actions |
| Lokal Geliştirme | Docker Compose (PostgreSQL + pgAdmin) |
| Responsive | Mobile-first yaklaşım |

> **Kural:** Workaround ve shortcut kesinlikle yasaktır. Her şey doğru mimari ile, production-grade yazılacaktır.

---

## 1. Monorepo Yapısı (pnpm workspaces)

```
stok-yonetim/
├── pnpm-workspace.yaml
├── package.json                  # root — scripts, lint, format
├── tsconfig.base.json            # paylaşılan TS config
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml                # lint + test + build
│       └── migration-check.yml   # migration tutarlılık kontrolü
│
├── packages/
│   └── ui/                       # @stok/ui — shared component library
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts        # library mode build
│       ├── src/
│       │   ├── index.ts          # barrel export
│       │   ├── theme/
│       │   │   ├── variables.css # CSS custom properties
│       │   │   └── reset.css
│       │   ├── components/
│       │   │   ├── Button/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Button.module.css
│       │   │   │   └── index.ts
│       │   │   ├── Input/
│       │   │   ├── Select/
│       │   │   ├── Modal/
│       │   │   ├── Table/
│       │   │   ├── Card/
│       │   │   ├── Badge/
│       │   │   ├── Sidebar/
│       │   │   ├── TopBar/
│       │   │   ├── Pagination/
│       │   │   ├── Toast/
│       │   │   ├── Tabs/
│       │   │   ├── DatePicker/
│       │   │   ├── Dropdown/
│       │   │   ├── SearchInput/
│       │   │   ├── Stat/
│       │   │   ├── EmptyState/
│       │   │   ├── Spinner/
│       │   │   ├── ConfirmDialog/
│       │   │   └── FormField/
│       │   └── hooks/
│       │       ├── useMediaQuery.ts
│       │       └── useClickOutside.ts
│       └── __tests__/
│
├── apps/
│   ├── api/                      # @stok/api — NestJS backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── knexfile.ts
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── app.config.ts
│   │   │   │   └── validation.ts
│   │   │   ├── database/
│   │   │   │   ├── database.module.ts
│   │   │   │   ├── database.service.ts    # Knex instance provider
│   │   │   │   ├── migrations/
│   │   │   │   │   ├── 20240101000001_create_customers.ts
│   │   │   │   │   ├── 20240101000002_create_products.ts
│   │   │   │   │   ├── 20240101000003_create_sales.ts
│   │   │   │   │   ├── 20240101000004_create_sale_items.ts
│   │   │   │   │   ├── 20240101000005_create_returns.ts
│   │   │   │   │   ├── 20240101000006_create_return_items.ts
│   │   │   │   │   ├── 20240101000007_create_payments.ts
│   │   │   │   │   ├── 20240101000008_create_expenses.ts
│   │   │   │   │   └── 20240101000009_create_account_transactions.ts
│   │   │   │   └── seeds/
│   │   │   │       └── 01_sample_data.ts
│   │   │   ├── common/
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   └── dto/
│   │   │   │       └── pagination.dto.ts
│   │   │   ├── modules/
│   │   │   │   ├── customers/
│   │   │   │   │   ├── customers.module.ts
│   │   │   │   │   ├── customers.controller.ts
│   │   │   │   │   ├── customers.service.ts
│   │   │   │   │   ├── customers.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── create-customer.dto.ts
│   │   │   │   │       └── update-customer.dto.ts
│   │   │   │   ├── products/
│   │   │   │   │   ├── products.module.ts
│   │   │   │   │   ├── products.controller.ts
│   │   │   │   │   ├── products.service.ts
│   │   │   │   │   ├── products.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── sales/
│   │   │   │   │   ├── sales.module.ts
│   │   │   │   │   ├── sales.controller.ts
│   │   │   │   │   ├── sales.service.ts
│   │   │   │   │   ├── sales.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── returns/
│   │   │   │   │   ├── returns.module.ts
│   │   │   │   │   ├── returns.controller.ts
│   │   │   │   │   ├── returns.service.ts
│   │   │   │   │   ├── returns.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── payments/
│   │   │   │   │   ├── payments.module.ts
│   │   │   │   │   ├── payments.controller.ts
│   │   │   │   │   ├── payments.service.ts
│   │   │   │   │   ├── payments.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── expenses/
│   │   │   │   │   ├── expenses.module.ts
│   │   │   │   │   ├── expenses.controller.ts
│   │   │   │   │   ├── expenses.service.ts
│   │   │   │   │   ├── expenses.repository.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── reports.module.ts
│   │   │   │   │   ├── reports.controller.ts
│   │   │   │   │   └── reports.service.ts
│   │   │   │   └── dashboard/
│   │   │   │       ├── dashboard.module.ts
│   │   │   │       ├── dashboard.controller.ts
│   │   │   │       └── dashboard.service.ts
│   │   │   └── health/
│   │   │       └── health.controller.ts
│   │   └── test/
│   │       ├── app.e2e-spec.ts
│   │       └── jest-e2e.json
│   │
│   └── web/                      # @stok/web — React + Vite frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── public/
│       │   └── favicon.svg
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── router.tsx         # React Router v6
│           ├── styles/
│           │   └── global.css     # @stok/ui tema import
│           ├── api/
│           │   ├── client.ts      # axios / fetch wrapper
│           │   ├── customers.api.ts
│           │   ├── products.api.ts
│           │   ├── sales.api.ts
│           │   ├── returns.api.ts
│           │   ├── payments.api.ts
│           │   ├── expenses.api.ts
│           │   ├── reports.api.ts
│           │   └── dashboard.api.ts
│           ├── hooks/
│           │   ├── useCustomers.ts
│           │   ├── useProducts.ts
│           │   ├── useSales.ts
│           │   └── ...
│           ├── pages/
│           │   ├── Dashboard/
│           │   │   ├── DashboardPage.tsx
│           │   │   ├── DashboardPage.module.css
│           │   │   └── index.ts
│           │   ├── Customers/
│           │   │   ├── CustomerListPage.tsx
│           │   │   ├── CustomerDetailPage.tsx
│           │   │   ├── CustomerFormPage.tsx
│           │   │   └── ...
│           │   ├── Products/
│           │   │   ├── ProductListPage.tsx
│           │   │   ├── ProductFormPage.tsx
│           │   │   └── ...
│           │   ├── Sales/
│           │   │   ├── SaleListPage.tsx
│           │   │   ├── NewSalePage.tsx     # 5 adımlı satış wizard
│           │   │   └── ...
│           │   ├── Returns/
│           │   │   ├── ReturnListPage.tsx
│           │   │   ├── NewReturnPage.tsx
│           │   │   └── ...
│           │   ├── Reports/
│           │   │   ├── ReportsPage.tsx
│           │   │   ├── SalesReport.tsx
│           │   │   ├── DebtReport.tsx
│           │   │   ├── VatReport.tsx
│           │   │   ├── ProfitLossReport.tsx
│           │   │   ├── CashFlowReport.tsx
│           │   │   └── ...
│           │   ├── Expenses/
│           │   │   ├── ExpenseListPage.tsx
│           │   │   └── ExpenseFormPage.tsx
│           │   └── NotFound.tsx
│           ├── layouts/
│           │   ├── MainLayout.tsx
│           │   ├── MainLayout.module.css
│           │   └── index.ts
│           ├── context/
│           │   ├── ThemeContext.tsx
│           │   └── ToastContext.tsx
│           └── utils/
│               ├── formatters.ts
│               ├── validators.ts
│               └── constants.ts
```

---

## 2. Docker Compose (Lokal Geliştirme)

```yaml
# docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: stok_user
      POSTGRES_PASSWORD: stok_pass
      POSTGRES_DB: stok_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stok_user -d stok_db"]
      interval: 5s
      timeout: 3s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@stok.local
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

---

## 3. Veritabanı Şeması (Knex Migrations)

### Tablolar ve İlişkiler

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  customers   │────<│    sales     │────<│  sale_items  │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                           │                     │
                     ┌─────┴──────┐        ┌─────┴──────┐
                     │  payments  │        │  products  │
                     └────────────┘        └────────────┘
                                                 │
┌──────────────┐     ┌──────────────┐     ┌──────┴───────┐
│  customers   │────<│   returns   │────<│ return_items │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌───────────────────────┐
│  customers   │────<│ account_transactions  │
└──────────────┘     └───────────────────────┘

┌──────────────┐
│   expenses   │  (bağımsız tablo)
└──────────────┘
```

### Tablo Detayları

#### customers
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| name | varchar(255) NOT NULL | Müşteri adı |
| phone | varchar(20) | Telefon |
| email | varchar(255) | E-posta |
| address | text | Adres |
| tax_number | varchar(20) | Vergi numarası |
| tax_office | varchar(100) | Vergi dairesi |
| balance | decimal(12,2) DEFAULT 0 | Cari bakiye (+ alacak, - borç) |
| notes | text | Notlar |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### products
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| name | varchar(255) NOT NULL | Ürün adı |
| barcode | varchar(50) UNIQUE | Barkod |
| category | varchar(100) | Kategori |
| unit | varchar(20) DEFAULT 'adet' | Birim |
| purchase_price | decimal(12,2) NOT NULL | Alış fiyatı |
| sale_price | decimal(12,2) NOT NULL | Satış fiyatı |
| vat_rate | decimal(5,2) DEFAULT 20 | KDV oranı (%) |
| stock_quantity | integer DEFAULT 0 | Stok miktarı |
| min_stock_level | integer DEFAULT 5 | Kritik stok seviyesi |
| is_active | boolean DEFAULT true | Aktif/pasif |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### sales
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| invoice_number | varchar(50) UNIQUE NOT NULL | Fatura no |
| customer_id | uuid FK → customers | |
| sale_date | timestamptz NOT NULL | Satış tarihi |
| subtotal | decimal(12,2) | Ara toplam |
| discount_amount | decimal(12,2) DEFAULT 0 | İskonto tutarı |
| discount_rate | decimal(5,2) DEFAULT 0 | İskonto oranı (%) |
| vat_total | decimal(12,2) DEFAULT 0 | KDV toplamı |
| grand_total | decimal(12,2) NOT NULL | Genel toplam |
| include_vat | boolean DEFAULT true | KDV dahil mi |
| payment_method | varchar(20) NOT NULL | nakit / kredi_karti / havale / veresiye |
| due_date | date | Vade tarihi (veresiye ise) |
| status | varchar(20) DEFAULT 'completed' | completed / cancelled / refunded |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### sale_items
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| sale_id | uuid FK → sales ON DELETE CASCADE | |
| product_id | uuid FK → products | |
| quantity | integer NOT NULL | Miktar |
| unit_price | decimal(12,2) NOT NULL | Birim fiyat |
| discount_rate | decimal(5,2) DEFAULT 0 | Kalem iskonto (%) |
| vat_rate | decimal(5,2) | KDV oranı |
| vat_amount | decimal(12,2) | KDV tutarı |
| line_total | decimal(12,2) NOT NULL | Satır toplamı |

#### returns
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| return_number | varchar(50) UNIQUE NOT NULL | İade no |
| sale_id | uuid FK → sales | İlişkili satış |
| customer_id | uuid FK → customers | |
| return_date | timestamptz NOT NULL | |
| total_amount | decimal(12,2) NOT NULL | İade toplamı |
| vat_total | decimal(12,2) DEFAULT 0 | KDV iadesi |
| reason | text | İade nedeni |
| status | varchar(20) DEFAULT 'completed' | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### return_items
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| return_id | uuid FK → returns ON DELETE CASCADE | |
| product_id | uuid FK → products | |
| sale_item_id | uuid FK → sale_items | Orijinal satış kalemi |
| quantity | integer NOT NULL | İade miktarı |
| unit_price | decimal(12,2) NOT NULL | |
| vat_amount | decimal(12,2) | |
| line_total | decimal(12,2) NOT NULL | |

#### payments
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK → customers | |
| sale_id | uuid FK → sales (nullable) | |
| payment_date | timestamptz NOT NULL | |
| amount | decimal(12,2) NOT NULL | |
| method | varchar(20) NOT NULL | nakit / kredi_karti / havale |
| notes | text | |
| created_at | timestamptz | |

#### expenses
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| category | varchar(50) NOT NULL | kira / vergi / maas / fatura / diger |
| description | text | |
| amount | decimal(12,2) NOT NULL | |
| expense_date | date NOT NULL | |
| is_recurring | boolean DEFAULT false | Tekrarlayan mı |
| recurrence_period | varchar(20) | aylik / yillik |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### account_transactions
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid FK → customers | |
| type | varchar(20) NOT NULL | borc / alacak |
| amount | decimal(12,2) NOT NULL | |
| description | text | |
| reference_type | varchar(20) | sale / return / payment |
| reference_id | uuid | İlişkili kayıt id |
| transaction_date | timestamptz NOT NULL | |
| created_at | timestamptz | |

---

## 4. CSS Tema Sistemi (CSS Variables)

```css
/* packages/ui/src/theme/variables.css */

:root {
  /* ── Colors ── */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #dbeafe;
  --color-secondary: #64748b;
  --color-success: #16a34a;
  --color-success-light: #dcfce7;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --color-danger: #dc2626;
  --color-danger-light: #fee2e2;
  --color-info: #0891b2;

  /* ── Surfaces ── */
  --color-bg: #f8fafc;
  --color-bg-elevated: #ffffff;
  --color-bg-sidebar: #1e293b;
  --color-border: #e2e8f0;
  --color-border-hover: #cbd5e1;

  /* ── Text ── */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  /* ── Typography ── */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ── Spacing ── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* ── Border Radius ── */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* ── Layout ── */
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --topbar-height: 56px;
  --content-max-width: 1280px;

  /* ── Transitions ── */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  /* ── Z-index ── */
  --z-sidebar: 40;
  --z-topbar: 30;
  --z-modal-backdrop: 50;
  --z-modal: 60;
  --z-toast: 70;
}

/* ── Dark theme (gelecekte) ── */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-elevated: #1e293b;
  --color-bg-sidebar: #0f172a;
  --color-border: #334155;
  --color-border-hover: #475569;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

---

## 5. GitHub CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: stok_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @stok/ui test -- --passWithNoTests
      - run: pnpm --filter @stok/api test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/stok_test

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @stok/ui build
      - run: pnpm --filter @stok/web build
      - run: pnpm --filter @stok/api build
```

---

## 6. API Endpoint Tasarımı

Tüm endpointler `/api/v1` prefix'i altında. Listeler paginate edilir.

### Customers
| Method | Path | Açıklama |
|---|---|---|
| GET | /customers | Liste (paginate, search, sort) |
| GET | /customers/:id | Detay |
| POST | /customers | Oluştur |
| PATCH | /customers/:id | Güncelle |
| DELETE | /customers/:id | Sil (soft delete) |
| GET | /customers/:id/transactions | Cari hesap hareketleri |
| GET | /customers/:id/sales | Müşterinin satışları |

### Products
| Method | Path | Açıklama |
|---|---|---|
| GET | /products | Liste (paginate, search, category, low-stock filter) |
| GET | /products/:id | Detay |
| POST | /products | Oluştur |
| PATCH | /products/:id | Güncelle |
| DELETE | /products/:id | Sil (soft delete) |
| GET | /products/low-stock | Kritik stok listesi |

### Sales
| Method | Path | Açıklama |
|---|---|---|
| GET | /sales | Liste (paginate, date range, customer, status) |
| GET | /sales/:id | Detay (items dahil) |
| POST | /sales | Yeni satış (stok + cari otomatik güncellenir) |
| PATCH | /sales/:id/cancel | Satış iptali |

### Returns
| Method | Path | Açıklama |
|---|---|---|
| GET | /returns | Liste |
| GET | /returns/:id | Detay |
| POST | /returns | Yeni iade (stok + cari otomatik güncellenir) |

### Payments
| Method | Path | Açıklama |
|---|---|---|
| GET | /payments | Liste |
| POST | /payments | Tahsilat kaydı (cari güncellenir) |

### Expenses
| Method | Path | Açıklama |
|---|---|---|
| GET | /expenses | Liste (category, date range) |
| POST | /expenses | Oluştur |
| PATCH | /expenses/:id | Güncelle |
| DELETE | /expenses/:id | Sil |

### Reports
| Method | Path | Açıklama |
|---|---|---|
| GET | /reports/sales-summary | Satış özeti (tarih aralığı) |
| GET | /reports/debt-overview | Borç/alacak özeti |
| GET | /reports/vat | KDV raporu |
| GET | /reports/profit-loss | Kar-zarar tablosu |
| GET | /reports/cash-flow | Nakit akışı |
| GET | /reports/top-products | En çok satan ürünler |
| GET | /reports/overdue-debts | Geciken borçlar |
| GET | /reports/upcoming-collections | Yaklaşan tahsilatlar |

### Dashboard
| Method | Path | Açıklama |
|---|---|---|
| GET | /dashboard/summary | Günlük özet (tüm metrikler) |

---

## 7. Backend Mimari Katmanları

Her modül aşağıdaki katmanları takip eder:

```
Controller → Service → Repository → Knex (DB)
     │            │
     │            └── İş kuralları, validasyon, transaction yönetimi
     └── HTTP katmanı, DTO validasyon, response dönüşümü
```

**Repository Pattern:** Knex sorgularını soyutlar. Service katmanı doğrudan Knex çağırmaz.

**Transaction Yönetimi:** Satış, iade gibi birden fazla tabloyu etkileyen işlemler `knex.transaction()` içinde yapılır:
- Satış → sale + sale_items + stok güncelleme + account_transaction + (opsiyonel) payment
- İade → return + return_items + stok geri ekleme + account_transaction

---

## 8. Shared Components (`@stok/ui`) Tasarım İlkeleri

1. **Her component kendi klasöründe:** `ComponentName/ComponentName.tsx`, `ComponentName.module.css`, `index.ts`
2. **CSS Modules kullan:** Scoped styling, theme variable referansları
3. **Props ile variant desteği:** `<Button variant="primary" size="sm" />`
4. **Inline component yasak:** Uygulama tarafında (`@stok/web`) tek kullanımlık component yerine `@stok/ui`'den compose et
5. **Mobile-first:** Tüm componentlar mobile-first yazılır, büyük ekran stilleri `@media (min-width: ...)` ile eklenir
6. **Erişilebilirlik:** Semantic HTML, ARIA attribute, keyboard navigation

### Component Listesi ve Prioriteleri

**P0 — İlk Sprint:**
Button, Input, Select, FormField, Card, Table, Pagination, Modal, Spinner, Toast, Badge

**P1 — İkinci Sprint:**
Sidebar, TopBar, Tabs, Dropdown, SearchInput, DatePicker, Stat, EmptyState, ConfirmDialog

**P2 — Sonraki:**
Charts wrapper, FileUpload, Stepper (satış wizard için)

---

## 9. Mobile-First Responsive Strateji

| Breakpoint | Genişlik | Davranış |
|---|---|---|
| mobile | < 640px | Tek kolon, sidebar gizli (hamburger ile açılır), tablo card görünümüne geçer |
| tablet | 640px – 1024px | 2 kolon grid, sidebar collapsed, tablo yatay scroll |
| desktop | > 1024px | Full layout, sidebar açık, tablo tam genişlik |

- Sidebar: Mobile'da overlay, tablet'te collapsed (64px icon), desktop'ta full (260px)
- Tablolar: Mobile'da her satır bir card'a dönüşür (`<Table responsive>`)
- Form'lar: Mobile'da full-width, desktop'ta 2 kolon grid

---

## 10. Geliştirme Fazları

### Faz 1 — Altyapı (1–2 hafta)
- [ ] pnpm monorepo kurulumu
- [ ] Docker Compose (PostgreSQL)
- [ ] NestJS boilerplate + Knex entegrasyonu
- [ ] DatabaseModule + migration altyapısı
- [ ] Tüm migration dosyaları (9 tablo)
- [ ] Seed data
- [ ] `@stok/ui` boilerplate + tema sistemi
- [ ] React + Vite boilerplate + router
- [ ] MainLayout (Sidebar + TopBar)
- [ ] GitHub CI pipeline
- [ ] P0 shared components

### Faz 2 — Müşteri & Ürün Modülü (1–2 hafta)
- [ ] Customers CRUD (API + UI)
- [ ] Products CRUD (API + UI)
- [ ] Barkod alanı
- [ ] Kategori filtreleme
- [ ] Düşük stok uyarısı

### Faz 3 — Satış Modülü (2 hafta)
- [ ] Satış API (transaction ile)
- [ ] 5 adımlı satış wizard UI (Stepper component)
- [ ] İskonto hesaplama
- [ ] KDV hesaplama
- [ ] Ödeme yöntemi seçimi
- [ ] Veresiye + vade
- [ ] Otomatik stok + cari güncelleme

### Faz 4 — İade & Ödeme Modülü (1 hafta)
- [ ] İade API + UI
- [ ] Faturadan ürün seçimi
- [ ] Stok geri ekleme
- [ ] Ödeme/tahsilat kaydı
- [ ] Cari hesap düzeltmeleri

### Faz 5 — Raporlar & Dashboard (1–2 hafta)
- [ ] Dashboard summary API + UI
- [ ] Satış raporu
- [ ] Borç/alacak raporu
- [ ] KDV raporu
- [ ] Kar-zarar tablosu
- [ ] Nakit akışı
- [ ] Grafikler (Recharts)
- [ ] P1 shared components

### Faz 6 — Gider Yönetimi & Finans (1 hafta)
- [ ] Expense CRUD
- [ ] Tekrarlayan gider desteği
- [ ] Gelir-gider analizi
- [ ] Bütçe takibi

### Faz 7 — Polish & Test (1 hafta)
- [ ] E2E testler
- [ ] Unit testler (service katmanı)
- [ ] Responsive QA (mobile, tablet, desktop)
- [ ] Error handling & empty states
- [ ] Loading states
- [ ] Dark theme (opsiyonel)

---

## 11. pnpm Workspace & Script Konfigürasyonu

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
```

```jsonc
// root package.json (scripts)
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:api": "pnpm --filter @stok/api dev",
    "dev:web": "pnpm --filter @stok/web dev",
    "build": "pnpm --filter @stok/ui build && pnpm -r --parallel build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter @stok/api knex migrate:latest",
    "db:rollback": "pnpm --filter @stok/api knex migrate:rollback",
    "db:seed": "pnpm --filter @stok/api knex seed:run",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

---

## 12. Ortam Değişkenleri

```env
# apps/api/.env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://stok_user:stok_pass@localhost:5432/stok_db
CORS_ORIGIN=http://localhost:5173

# apps/web/.env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

> Bu plan, orijinal README'deki tüm özellikleri kapsar. Teknoloji seçimleri kullanıcının son taleplerine göre güncellenmiştir. Her detay production-grade ve best-practice'e uygun şekilde planlanmıştır.
