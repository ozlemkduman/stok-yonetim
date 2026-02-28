# Staging Ortami Kurulum Talimatlari

## 1. Staging Database Olusturma

Mevcut postgres workload'inda ikinci bir database olustur:

```bash
# Postgres container'a baglan
cpln workload exec postgres --gvc default-gvc -- psql -U stok_user -d stok_db

# Staging database olustur
CREATE DATABASE stok_staging_db OWNER stok_user;

# Dogrula
\l
\q
```

## 2. Staging API Workload Olusturma

```bash
# Workload YAML'ini uygula
cpln apply -f infra/stok-api-staging-workload.yml --gvc default-gvc --org ozlemkduman

# ONEMLI: Asagidaki env var'lari guncelle (gizli degerler YAML'da placeholder):
# - ADMIN_API_KEY -> guclu bir key ile degistir
# - Diger gizli degerler (JWT_SECRET, RESEND_API_KEY vb.) production'dan kopyala
```

### Eksik Environment Variable'lari Ekleme

Production workload'dan env var'lari kontrol et ve staging'e ekle:

```bash
# Production env var'lari gor
cpln workload get stok-api --gvc default-gvc -o yaml | grep -A 100 'env:'

# Staging'e eksik env var ekle (ornek)
cpln workload update stok-api-staging --gvc default-gvc \
  --set spec.containers[0].env.JWT_SECRET=<AYRI_JWT_SECRET> \
  --set spec.containers[0].env.RESEND_API_KEY=<RESEND_API_KEY>
```

## 3. Cloudflare Pages Ayarlari (Manuel)

Cloudflare Pages dashboard'da:

1. **Branch Deployments:** Settings > Builds > Branch deployments > `develop` ekle
2. **Preview Environment Variables:**
   - `VITE_API_BASE_URL` = staging API'nin public URL'i
3. **Custom Domain:** `staging.stoksayac.com` -> preview deployment'a bagla

## 4. Dogrulama

```bash
# Staging API saglik kontrolu
curl https://stok-api-staging-<WORKLOAD_ID>.cpln.app/api/v1/health

# Staging DB baglantisi
cpln workload exec postgres --gvc default-gvc -- psql -U stok_user -d stok_staging_db -c "SELECT 1"
```

## Akis

```
develop'a push -> GitHub Actions -> stok-api:staging image -> cpln stok-api-staging guncellenir
                                 -> Cloudflare Pages develop branch preview deploy

develop'u main'e merge -> GitHub Actions -> stok-api:latest image -> cpln stok-api guncellenir
                                         -> Cloudflare Pages production deploy
```
