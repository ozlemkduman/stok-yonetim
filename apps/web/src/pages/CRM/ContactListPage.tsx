import { useState, useEffect } from 'react';
import { Table, Button, Card, Input, Select, type Column } from '@stok/ui';
import { crmApi, CrmContact } from '../../api/crm.api';
import { ContactFormModal } from './ContactFormModal';
import styles from './ContactListPage.module.css';

const statusLabels: Record<string, string> = {
  lead: 'Potansiyel',
  prospect: 'Aday',
  customer: 'Musteri',
  inactive: 'Pasif',
};

const sourceLabels: Record<string, string> = {
  website: 'Web Sitesi',
  referral: 'Referans',
  social: 'Sosyal Medya',
  cold_call: 'Soguk Arama',
  event: 'Etkinlik',
  other: 'Diger',
};

export function ContactListPage() {
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
      console.error('Kisiler yuklenemedi:', error);
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
    if (!confirm('Bu kisiyi silmek istediginize emin misiniz?')) return;
    try {
      await crmApi.deleteContact(id);
      fetchContacts();
    } catch (error) {
      console.error('Silme hatasi:', error);
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
    { key: 'name', header: 'Ad Soyad', width: '20%' },
    {
      key: 'status',
      header: 'Durum',
      width: '12%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    { key: 'email', header: 'E-posta', width: '18%' },
    { key: 'phone', header: 'Telefon', width: '12%' },
    {
      key: 'source',
      header: 'Kaynak',
      width: '12%',
      render: (item) => (item.source ? sourceLabels[item.source] : '-'),
    },
    {
      key: 'next_follow_up',
      header: 'Sonraki Takip',
      width: '12%',
      render: (item) =>
        item.next_follow_up
          ? new Date(item.next_follow_up).toLocaleDateString('tr-TR')
          : '-',
    },
    {
      key: 'actions',
      header: 'Islemler',
      width: '14%',
      render: (item) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            Duzenle
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>CRM - Kisiler</h1>
        <Button onClick={handleAdd}>Yeni Kisi</Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tum Durumlar' },
              { value: 'lead', label: 'Potansiyel' },
              { value: 'prospect', label: 'Aday' },
              { value: 'customer', label: 'Musteri' },
              { value: 'inactive', label: 'Pasif' },
            ]}
          />
          <Button onClick={handleSearch}>Ara</Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={contacts}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="Kisi bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Onceki
            </Button>
            <span>
              Sayfa {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sonraki
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
