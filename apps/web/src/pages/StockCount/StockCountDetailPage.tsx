import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card, Input } from '@stok/ui';
import { stockCountApi, StockCountDetail, StockCountItem } from '../../api/stock-count.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockCountDetailPage.module.css';

export function StockCountDetailPage() {
  const { t } = useTranslation(['stockCount', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [data, setData] = useState<StockCountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'counted' | 'uncounted' | 'differences'>('all');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await stockCountApi.getById(id);
        setData(res.data);
      } catch {
        showToast('error', t('stockCount:toast.loadError'));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleItemBlur = async (item: StockCountItem, rawValue: string) => {
    if (!id || !data) return;
    if (data.status !== 'in_progress') return;
    const value = parseFloat(rawValue);
    if (isNaN(value) || value < 0) {
      // Reset on invalid
      setDraftValues((prev) => ({ ...prev, [item.id]: '' }));
      return;
    }
    if (item.counted_quantity != null && Number(item.counted_quantity) === value) return; // no change

    setSavingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await stockCountApi.updateItem(id, item.id, { counted_quantity: value });
      setData((prev) => prev ? {
        ...prev,
        items: prev.items.map((it) => it.id === item.id ? { ...it, ...res.data } : it),
      } : prev);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('stockCount:toast.saveError'));
    } finally {
      setSavingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    }
  };

  const handleComplete = async () => {
    if (!id || !data) return;
    const counted = data.items.filter((it) => it.counted_quantity != null).length;
    const total = data.items.length;
    const confirmed = await confirm({
      message: t('stockCount:confirm.complete', { counted, total }),
      variant: 'primary',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      const res = await stockCountApi.complete(id);
      showToast(
        'success',
        t('stockCount:toast.completed', { ...res.data }),
      );
      const refresh = await stockCountApi.getById(id);
      setData(refresh.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('stockCount:toast.completeError'));
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!id) return;
    const confirmed = await confirm({ message: t('stockCount:confirm.cancel'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await stockCountApi.cancel(id);
      showToast('success', t('stockCount:toast.cancelled'));
      const refresh = await stockCountApi.getById(id);
      setData(refresh.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('stockCount:toast.cancelError'));
    }
  };

  const stats = useMemo(() => {
    if (!data) return { total: 0, counted: 0, uncounted: 0, withDiff: 0 };
    const total = data.items.length;
    const counted = data.items.filter((it) => it.counted_quantity != null).length;
    const withDiff = data.items.filter((it) =>
      it.counted_quantity != null && Number(it.counted_quantity) !== Number(it.expected_quantity)
    ).length;
    return { total, counted, uncounted: total - counted, withDiff };
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    let list = data.items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((it) =>
        (it.product_name?.toLowerCase().includes(q) || it.product_barcode?.toLowerCase().includes(q))
      );
    }
    if (filter === 'counted') list = list.filter((it) => it.counted_quantity != null);
    if (filter === 'uncounted') list = list.filter((it) => it.counted_quantity == null);
    if (filter === 'differences') list = list.filter((it) =>
      it.counted_quantity != null && Number(it.counted_quantity) !== Number(it.expected_quantity)
    );
    return list;
  }, [data, search, filter]);

  if (loading) return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  if (!data) return <div className={styles.error}>{t('stockCount:detail.notFound')}</div>;

  const isActive = data.status === 'in_progress';
  const statusVariant = data.status === 'completed' ? 'success' : data.status === 'cancelled' ? 'danger' : 'warning';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/stock-count')}>&larr; {t('stockCount:detail.back')}</Button>
          <h1 className={styles.title}>{data.count_number}</h1>
          <div className={styles.meta}>
            <Badge variant={statusVariant}>{t(`stockCount:statuses.${data.status}`, { defaultValue: data.status })}</Badge>
            <span>{formatDate(data.started_at)}</span>
            {data.completed_at && <span>· {t('stockCount:detail.completedAt')}: {formatDate(data.completed_at)}</span>}
          </div>
        </div>
        {isActive && (
          <div className={styles.actionsTop}>
            <Button variant="danger" onClick={handleCancel}>{t('stockCount:detail.cancel')}</Button>
            <Button variant="primary" onClick={handleComplete} disabled={submitting || stats.counted === 0}>
              {submitting ? t('stockCount:detail.completing') : t('stockCount:detail.complete')}
            </Button>
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <div className={styles.statLabel}>{t('stockCount:stats.total')}</div>
          <div className={styles.statValue}>{stats.total}</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>{t('stockCount:stats.counted')}</div>
          <div className={styles.statValue}>{stats.counted}</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>{t('stockCount:stats.uncounted')}</div>
          <div className={styles.statValue}>{stats.uncounted}</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>{t('stockCount:stats.differences')}</div>
          <div className={`${styles.statValue} ${stats.withDiff > 0 ? styles.statDanger : ''}`}>{stats.withDiff}</div>
        </Card>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('stockCount:detail.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.tabs}>
          {(['all', 'uncounted', 'counted', 'differences'] as const).map((f) => (
            <button
              key={f}
              className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {t(`stockCount:detail.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{t('stockCount:detail.product')}</th>
              <th style={{ textAlign: 'right' }}>{t('stockCount:detail.expected')}</th>
              <th style={{ textAlign: 'right' }}>
                {t('stockCount:detail.counted')}
                <div className={styles.colHint}>{t('stockCount:detail.countedHint')}</div>
              </th>
              <th style={{ textAlign: 'right' }}>{t('stockCount:detail.difference')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const expected = Number(item.expected_quantity);
              const counted = item.counted_quantity != null ? Number(item.counted_quantity) : null;
              const diff = counted != null ? counted - expected : null;
              const draft = draftValues[item.id] ?? (counted != null ? String(counted) : '');
              return (
                <tr key={item.id} className={diff != null && diff !== 0 ? styles.rowDiff : ''}>
                  <td>
                    {item.product_name || '-'}
                    {item.product_is_active === false && <span className={styles.inactiveBadge}>({t('common:labels.inactive')})</span>}
                    {item.product_barcode && <div className={styles.barcode}>{item.product_barcode}</div>}
                  </td>
                  <td className={styles.right}>{parseFloat(String(expected))} {item.product_unit || ''}</td>
                  <td className={styles.right}>
                    {isActive ? (
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={draft}
                        aria-label={`${item.product_name} - ${t('stockCount:detail.counted')}`}
                        onChange={(e) => setDraftValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onBlur={(e) => handleItemBlur(item, e.target.value)}
                        disabled={savingIds.has(item.id)}
                        className={styles.countedInput}
                      />
                    ) : (
                      counted != null ? `${counted} ${item.product_unit || ''}` : '-'
                    )}
                  </td>
                  <td className={`${styles.right} ${diff != null && diff !== 0 ? (diff > 0 ? styles.posDiff : styles.negDiff) : ''}`}>
                    {diff != null ? (diff > 0 ? `+${diff}` : diff) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && <div className={styles.empty}>{t('stockCount:detail.noResults')}</div>}
      </Card>

      {data.notes && (
        <Card>
          <h3>{t('stockCount:detail.notes')}</h3>
          <p>{data.notes}</p>
        </Card>
      )}
    </div>
  );
}
