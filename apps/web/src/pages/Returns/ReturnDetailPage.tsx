import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { returnsApi, ReturnDetail } from '../../api/returns.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ReturnDetailPage.module.css';

const statusLabels: Record<string, string> = {
  completed: 'Tamamlandi',
  cancelled: 'Iptal Edildi',
  pending: 'Beklemede',
};

const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  completed: 'success',
  cancelled: 'danger',
  pending: 'warning',
};

export function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await returnsApi.getById(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Iade bulunamadi'}</div>
        <Button onClick={() => navigate('/returns')}>Geri Don</Button>
      </div>
    );
  }

  const subtotal = data.total_amount - data.vat_total;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/returns')}>
            ← Iadeler
          </Button>
          <h1 className={styles.title}>{data.return_number}</h1>
          <div className={styles.returnMeta}>
            <span>{formatDate(data.return_date)}</span>
            <Badge variant={statusVariants[data.status] || 'default'}>
              {statusLabels[data.status] || data.status}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Toplam Tutar</span>
            <span className={styles.totalValue}>{formatCurrency(data.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        {/* Return Info */}
        <Card className={styles.infoCard}>
          <h3>Iade Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Iade No</span>
              <span className={styles.infoValue}>{data.return_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tarih</span>
              <span className={styles.infoValue}>{formatDate(data.return_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Durum</span>
              <span className={styles.infoValue}>
                <Badge variant={statusVariants[data.status] || 'default'}>
                  {statusLabels[data.status] || data.status}
                </Badge>
              </span>
            </div>
            {data.reason && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Iade Nedeni</span>
                <span className={styles.infoValue}>{data.reason}</span>
              </div>
            )}
            {data.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kaydeden</span>
                <span className={styles.infoValue}>{data.created_by_name}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className={styles.infoCard}>
          <h3>Musteri Bilgileri</h3>
          <div className={styles.infoList}>
            {data.customer_name ? (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Musteri</span>
                  <span className={styles.infoValue}>
                    {data.customer_id ? (
                      <Link to={`/customers/${data.customer_id}`} className={styles.link}>
                        {data.customer_name}
                      </Link>
                    ) : (
                      data.customer_name
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.emptyInfo}>Musteri bilgisi yok</div>
            )}
          </div>
        </Card>

        {/* Related Sale Info */}
        <Card className={styles.infoCard}>
          <h3>Iliskili Satis</h3>
          <div className={styles.infoList}>
            {data.sale_id && data.sale_invoice_number ? (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Fatura No</span>
                  <span className={styles.infoValue}>
                    <span className={styles.saleNumber}>{data.sale_invoice_number}</span>
                  </span>
                </div>
                {data.sale_date && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Satis Tarihi</span>
                    <span className={styles.infoValue}>{formatDate(data.sale_date)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyInfo}>Iliskili satis yok</div>
            )}
          </div>
        </Card>
      </div>

      {/* Return Items */}
      <Card className={styles.itemsCard}>
        <h3>Iade Kalemleri</h3>
        {data.items && data.items.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Urun</th>
                  <th>Barkod</th>
                  <th className={styles.textRight}>Miktar</th>
                  <th className={styles.textRight}>Birim Fiyat</th>
                  <th className={styles.textRight}>KDV</th>
                  <th className={styles.textRight}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.productName}>{item.product_name}</td>
                    <td className={styles.barcode}>{item.barcode || '-'}</td>
                    <td className={styles.textRight}>{item.quantity}</td>
                    <td className={styles.textRight}>{formatCurrency(item.unit_price)}</td>
                    <td className={styles.textRight}>{formatCurrency(item.vat_amount)}</td>
                    <td className={styles.textRight}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>Iade kalemi bulunamadi</div>
        )}
      </Card>

      {/* Totals */}
      <Card className={styles.totalsCard}>
        <h3>Ozet</h3>
        <div className={styles.totalsGrid}>
          <div className={styles.totalRow}>
            <span className={styles.totalRowLabel}>Ara Toplam</span>
            <span className={styles.totalRowValue}>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalRowLabel}>KDV Toplam</span>
            <span className={styles.totalRowValue}>{formatCurrency(data.vat_total)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
            <span className={styles.totalRowLabel}>Genel Toplam</span>
            <span className={styles.grandTotalValue}>{formatCurrency(data.total_amount)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
