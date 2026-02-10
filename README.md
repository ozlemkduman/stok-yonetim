# Stok Yonetim Sistemi

Modern, kapsamli bir stok ve musteri yonetim sistemi.

**Canli Demo:** https://stokbak.kutbulut.app

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Monorepo | pnpm workspaces |
| Backend | NestJS + TypeScript |
| Veritabani | PostgreSQL |
| ORM/Query Builder | Knex.js |
| Frontend | React 18 + Vite + TypeScript |
| UI Kutuphanesi | @stok/ui (custom components) |
| Styling | CSS Modules + CSS Custom Properties |
| Deployment | Docker + Kutbulut |

## Ozellikler

### Musteri Yonetimi
- [x] Musteri ekleme, duzenleme, silme
- [x] Musteri listesi ve arama
- [x] Musteri detay sayfasi
- [x] Borc/alacak takibi
- [x] Musteri durumu (aktif/pasif)

### Urun Yonetimi
- [x] Urun ekleme, duzenleme, silme
- [x] Barkod sistemi
- [x] Stok takibi (otomatik guncelleme)
- [x] Kritik stok seviyesi uyarilari
- [x] Kategori yonetimi
- [x] KDV orani tanimlama

### Satis Islemleri
- [x] Yeni satis olusturma
- [x] Satis listesi ve detay
- [x] Coklu odeme yontemi (nakit, kredi karti, havale, veresiye)
- [x] Otomatik stok guncelleme
- [x] Otomatik cari hesap guncelleme
- [x] Satis iptali

### Iade Yonetimi
- [x] Urun iade islemi
- [x] Iade listesi ve detay
- [x] Otomatik stok geri ekleme
- [x] Cari hesap duzeltmesi

### Kasa/Banka Hesaplari
- [x] Hesap tanimlama (kasa, banka)
- [x] Hesap hareketleri
- [x] Hesaplar arasi transfer
- [x] Bakiye takibi

### Coklu Depo Takibi
- [x] Depo tanimlama
- [x] Depo bazli stok takibi
- [x] Depolar arasi transfer
- [x] Stok hareketi gecmisi

### Teklif Yonetimi
- [x] Teklif olusturma
- [x] Teklif gonderme
- [x] Teklif kabul/red
- [x] Teklifi satisa donusturme
- [x] Gecerlilik suresi takibi

### e-Belge Cozumleri (Mock)
- [x] e-Fatura
- [x] e-Arsiv
- [x] e-Irsaliye
- [x] e-SMM
- [x] GIB entegrasyonu (mock)

### Entegrasyonlar
- [x] e-Ticaret entegrasyonu (Trendyol, Hepsiburada, N11 - mock)
- [x] Banka entegrasyonu (mock)
- [x] Entegrasyon loglari

### CRM
- [x] Musteri aday/potansiyel takibi
- [x] Aktivite yonetimi (gorusme, toplanti, teklif)
- [x] Musteri durumu (lead, prospect, customer)

### Saha Ekip Yonetimi
- [x] Rota planlama
- [x] Ziyaret takibi
- [x] Check-in/Check-out
- [x] Gunluk istatistikler

### Gider Yonetimi
- [x] Gider kategorileri (kira, fatura, maas, vergi, diger)
- [x] Tekrarlayan giderler
- [x] Gider raporlari

### Raporlama
- [x] Satis ozeti raporu
- [x] Borc-alacak raporu
- [x] KDV raporu
- [x] Kar-zarar raporu
- [x] En cok satan urunler

### Dashboard
- [x] Gunluk satis ozeti
- [x] Toplam musteri sayisi
- [x] Toplam urun sayisi
- [x] Dusuk stok uyarilari
- [x] En borclu musteriler
- [x] Hizli erisim butonlari

## Kurulum

### Gereksinimler
- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Docker (opsiyonel)

### Yerel Gelistirme

```bash
# Repoyu klonla
git clone https://github.com/ozlemkduman/stok-yonetim.git
cd stok-yonetim

# Bagimliliklari yukle
pnpm install

# PostgreSQL baslat (Docker ile)
docker compose up -d postgres

# .env dosyasini olustur
cp apps/api/.env.example apps/api/.env

# Migration calistir
pnpm db:migrate

# Ornek veri yukle
pnpm db:seed

# Gelistirme sunucularini baslat
pnpm dev
```

Tarayicida:
- Frontend: http://localhost:5173
- API: http://localhost:3001

### Production Build

```bash
# Build
pnpm build

# Docker imajlari olustur
docker build --platform linux/amd64 -f apps/api/Dockerfile -t stok-api .
docker build --platform linux/amd64 -f apps/web/Dockerfile -t stok-web .
```

## Proje Yapisi

```
stok-yonetim/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modulleri
│   │   │   │   ├── customers/
│   │   │   │   ├── products/
│   │   │   │   ├── sales/
│   │   │   │   ├── returns/
│   │   │   │   ├── payments/
│   │   │   │   ├── expenses/
│   │   │   │   ├── accounts/
│   │   │   │   ├── warehouses/
│   │   │   │   ├── quotes/
│   │   │   │   ├── e-documents/
│   │   │   │   ├── integrations/
│   │   │   │   ├── crm/
│   │   │   │   ├── field-team/
│   │   │   │   ├── dashboard/
│   │   │   │   └── reports/
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   └── common/
│   │   └── Dockerfile
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── pages/          # Sayfa bilesenleri
│       │   ├── api/            # API istemcileri
│       │   ├── hooks/          # Custom hooks
│       │   ├── context/        # React context
│       │   ├── layouts/        # Layout bilesenleri
│       │   └── styles/         # Global stiller
│       └── Dockerfile
│
├── packages/
│   └── ui/                     # Paylasilan UI kutuphanesi
│       └── src/
│           ├── components/     # Button, Input, Table, Modal, vb.
│           └── theme/          # CSS degiskenleri
│
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## API Endpoints

### Customers
- `GET /api/v1/customers` - Musteri listesi
- `GET /api/v1/customers/:id` - Musteri detay
- `POST /api/v1/customers` - Yeni musteri
- `PATCH /api/v1/customers/:id` - Musteri guncelle
- `DELETE /api/v1/customers/:id` - Musteri sil

### Products
- `GET /api/v1/products` - Urun listesi
- `GET /api/v1/products/low-stock` - Dusuk stoklu urunler
- `POST /api/v1/products` - Yeni urun
- `PATCH /api/v1/products/:id` - Urun guncelle

### Sales
- `GET /api/v1/sales` - Satis listesi
- `POST /api/v1/sales` - Yeni satis
- `PATCH /api/v1/sales/:id/cancel` - Satis iptal

### Reports
- `GET /api/v1/reports/sales-summary` - Satis ozeti
- `GET /api/v1/reports/debt-overview` - Borc-alacak
- `GET /api/v1/reports/vat` - KDV raporu
- `GET /api/v1/reports/profit-loss` - Kar-zarar

### Health
- `GET /api/v1/health` - Sistem durumu

## Ortam Degiskenleri

### API (.env)
```env
DATABASE_URL=postgres://user:pass@localhost:5432/stok_db
NODE_ENV=development
PORT=3001
```

### Web (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## Yapilacaklar (Roadmap)

- [ ] Kullanici giris sistemi (JWT Authentication)
- [ ] Rol bazli yetkilendirme
- [ ] Gercek e-Fatura entegrasyonu (GIB)
- [ ] Gercek e-ticaret entegrasyonlari
- [ ] Barkod okuyucu entegrasyonu
- [ ] PDF fatura/teklif ciktisi
- [ ] Email bildirimleri
- [ ] WhatsApp entegrasyonu
- [ ] Mobil uygulama (React Native)
- [ ] Gelismis analitik ve grafikler
- [ ] Coklu dil destegi

## Lisans

MIT License

## Gelistirici

Ozlem Karaduman - [@ozlemkduman](https://github.com/ozlemkduman)
