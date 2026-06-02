import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@stok/ui';
import { useTenant } from '../context/TenantContext';
import styles from './UpgradeCard.module.css';

// Mevcut plana göre bir sonraki seviyede AÇILACAK 3 öne çıkan özellik
const NEXT_TIER_FEATURES: Record<string, { title: string; items: string[]; targetPlan: string }> = {
  basic: {
    targetPlan: 'Pro',
    title: 'Pro plana yükseltin',
    items: [
      'Teklif yönetimi & E-Fatura/E-Arşiv',
      'Çoklu depo & fatura import',
      'Gelişmiş raporlar (Kar/Zarar, KDV, Personel)',
    ],
  },
  pro: {
    targetPlan: 'Plus',
    title: 'Plus plana yükseltin',
    items: [
      'CRM (müşteri ilişkileri)',
      'Saha ekibi ve rota yönetimi',
      'API erişimi & sınırsız her şey',
    ],
  },
};

export function UpgradeCard() {
  const navigate = useNavigate();
  const { settings } = useTenant();
  const currentCode = settings?.plan_code;

  // Plus kullanıcılar için kart gösterme
  if (!currentCode || currentCode === 'plus') return null;
  const next = NEXT_TIER_FEATURES[currentCode];
  if (!next) return null;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.icon}>⚡</span>
          <div>
            <h3 className={styles.title}>{next.title}</h3>
            <p className={styles.subtitle}>Şu an: <strong>{settings?.plan_name || currentCode}</strong></p>
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={() => navigate('/settings')}>
          Planları Karşılaştır
        </Button>
      </div>
      <ul className={styles.list}>
        {next.items.map((item) => (
          <li key={item} className={styles.item}>
            <span className={styles.check}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
