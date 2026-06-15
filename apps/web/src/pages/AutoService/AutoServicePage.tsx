import { useTranslation } from 'react-i18next';
import { Card } from '@stok/ui';

/**
 * Oto Servis modülü ana sayfası (placeholder — Faz 0).
 * Sadece business_type='auto_service' olan tenant'lara görünür (SectorGate + sidebar).
 * Faz 1+ ile araç kaydı, iş emri, servis geçmişi sekmeleri buraya eklenecek.
 */
export function AutoServicePage() {
  const { t } = useTranslation('nav');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>{t('items.autoService')}</h1>
      <Card>
        <div style={{ padding: 24, color: '#6b7280' }}>
          {t('autoService.comingSoon', {
            defaultValue:
              'Oto servis modülü hazırlanıyor. Yakında araç kaydı, iş emri ve servis geçmişi burada olacak.',
          })}
        </div>
      </Card>
    </div>
  );
}
