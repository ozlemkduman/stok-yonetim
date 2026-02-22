import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Card, Input, Select, type Column } from '@stok/ui';
import { crmApi, CrmContact } from '../../api/crm.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import { ContactFormModal } from './ContactFormModal';
import styles from './ContactListPage.module.css';

export function ContactListPage() {
  const { t } = useTranslation(['crm', 'common']);
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await crmApi.getContacts({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setContacts(response.data);
      if (response.meta) {
        setTotalPages(response.meta.totalPages);
      }
    } catch (error) {
      showToast('error', t('crm:toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchContacts();
  };

  const handleAdd = () => {
    setSelectedContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact: CrmContact) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: t('crm:confirm.delete'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await crmApi.deleteContact(id);
      fetchContacts();
    } catch (error) {
      showToast('error', t('crm:toast.deleteError'));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedContact(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchContacts();
  };

  const columns: Column<CrmContact>[] = [
    {
      key: 'name',
      header: t('crm:columns.name'),
      width: '20%',
      render: (item) => (
        <span
          className={styles.nameLink}
          onClick={() => navigate(`/crm/${item.id}`)}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('crm:columns.status'),
      width: '12%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {t(`crm:status.${item.status}`)}
        </span>
      ),
    },
    { key: 'email', header: t('crm:columns.email'), width: '18%' },
    { key: 'phone', header: t('crm:columns.phone'), width: '12%' },
    {
      key: 'source',
      header: t('crm:columns.source'),
      width: '12%',
      render: (item) => (item.source ? t(`crm:source.${item.source}`) : '-'),
    },
    {
      key: 'next_follow_up',
      header: t('crm:columns.nextFollowUp'),
      width: '12%',
      render: (item) =>
        item.next_follow_up
          ? new Date(item.next_follow_up).toLocaleDateString('tr-TR')
          : '-',
    },
    {
      key: 'actions',
      header: t('crm:columns.actions'),
      width: '14%',
      render: (item) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/crm/${item.id}`)}>
            {t('crm:buttons.detail')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            {t('crm:buttons.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            {t('crm:buttons.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('crm:pageTitle')}</h1>
        <Button onClick={handleAdd}>{t('crm:newContact')}</Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder={t('crm:searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: t('crm:filter.allStatuses') },
              { value: 'lead', label: t('crm:status.lead') },
              { value: 'prospect', label: t('crm:status.prospect') },
              { value: 'customer', label: t('crm:status.customer') },
              { value: 'inactive', label: t('crm:status.inactive') },
            ]}
          />
          <Button onClick={handleSearch}>{t('crm:search')}</Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={contacts}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage={t('crm:empty')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('crm:pagination.previous')}
            </Button>
            <span>
              {t('crm:pagination.pageOf', { page, totalPages })}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('crm:pagination.next')}
            </Button>
          </div>
        )}
      </Card>

      {modalOpen && (
        <ContactFormModal
          contact={selectedContact}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
