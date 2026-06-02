import { Button } from '@stok/ui';
import { useTenant } from '../context/TenantContext';
import styles from './PlanComparison.module.css';

interface PlanRow {
  label: string;
  basic: string | boolean;
  pro: string | boolean;
  plus: string | boolean;
}

const ROWS: PlanRow[] = [
  // Limitler
  { label: 'Kullanıcı', basic: '1', pro: '5', plus: 'Sınırsız' },
  { label: 'Ürün', basic: '200', pro: '5.000', plus: 'Sınırsız' },
  { label: 'Müşteri', basic: '100', pro: '2.000', plus: 'Sınırsız' },
  { label: 'Depo', basic: '1', pro: '3', plus: 'Sınırsız' },
  { label: 'Depolama', basic: '5 GB', pro: '25 GB', plus: '100 GB' },
  // Temel
  { label: 'Stok takibi', basic: true, pro: true, plus: true },
  { label: 'Satış / İade', basic: true, pro: true, plus: true },
  { label: 'Müşteri / Cari hesap', basic: true, pro: true, plus: true },
  { label: 'Kasa/Banka, Giderler', basic: true, pro: true, plus: true },
  { label: 'Temel raporlar', basic: true, pro: true, plus: true },
  // Pro
  { label: 'Teklif yönetimi', basic: false, pro: true, plus: true },
  { label: 'Çoklu depo', basic: false, pro: true, plus: true },
  { label: 'Fatura import', basic: false, pro: true, plus: true },
  { label: 'Entegrasyonlar', basic: false, pro: true, plus: true },
  { label: 'Gelişmiş raporlar (Kar/Zarar, KDV, Personel, Yenileme)', basic: false, pro: true, plus: true },
  // Plus
  { label: 'CRM', basic: false, pro: false, plus: true },
  { label: 'Saha ekibi', basic: false, pro: false, plus: true },
  { label: 'API erişimi (yakında)', basic: false, pro: false, plus: true },
];

const PLAN_PRICES = { basic: '199 ₺/ay', pro: '449 ₺/ay', plus: '799 ₺/ay' };

function cellValue(v: string | boolean): React.ReactNode {
  if (typeof v === 'string') return v;
  return v ? <span className={styles.check}>✓</span> : <span className={styles.dash}>—</span>;
}

interface Props {
  showUpgradeButton?: boolean;
}

export function PlanComparison({ showUpgradeButton = true }: Props) {
  const { settings } = useTenant();
  const currentCode = settings?.plan_code;

  const handleUpgrade = () => {
    window.open('mailto:destek@stoksayac.com?subject=Plan%20Y%C3%BCkseltme', '_blank');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {(['basic', 'pro', 'plus'] as const).map((code) => {
          const isCurrent = currentCode === code;
          const isRecommended = code === 'pro';
          return (
            <div
              key={code}
              className={`${styles.planCard} ${isCurrent ? styles.current : ''} ${isRecommended ? styles.recommended : ''}`}
            >
              {isRecommended && !isCurrent && <div className={styles.badge}>Önerilen</div>}
              {isCurrent && <div className={styles.badgeCurrent}>Mevcut Planınız</div>}
              <h3 className={styles.planName}>{code.charAt(0).toUpperCase() + code.slice(1)}</h3>
              <div className={styles.price}>{PLAN_PRICES[code]}</div>
              <ul className={styles.features}>
                {ROWS.map((row) => (
                  <li key={row.label} className={styles.featureRow}>
                    <span className={styles.featureLabel}>{row.label}</span>
                    <span className={styles.featureValue}>{cellValue(row[code])}</span>
                  </li>
                ))}
              </ul>
              {showUpgradeButton && !isCurrent && currentCode !== 'plus' && (
                <Button variant={isRecommended ? 'primary' : 'secondary'} fullWidth onClick={handleUpgrade}>
                  {code === currentCode ? 'Mevcut' : `${code.charAt(0).toUpperCase() + code.slice(1)} planına geç`}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
