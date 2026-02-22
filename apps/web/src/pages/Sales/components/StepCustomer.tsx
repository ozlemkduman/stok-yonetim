import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Card } from '@stok/ui';
import { Customer } from '../../../api/customers.api';
import styles from '../SaleFormPage.module.css';

interface StepCustomerProps {
  customerId: string;
  customers: Customer[];
  onCustomerChange: (customerId: string) => void;
  onOpenCustomerModal: () => void;
}

export function StepCustomer({
  customerId,
  customers,
  onCustomerChange,
  onOpenCustomerModal,
}: StepCustomerProps) {
  const { t } = useTranslation(['sales', 'common']);
  const [search, setSearch] = useState('');

  const selectedCustomer = customers.find(c => c.id === customerId);
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.stepContent}>
      <div className={styles.customerOptions}>
        <button
          type="button"
          className={`${styles.customerOption} ${!customerId ? styles.customerOptionActive : ''}`}
          onClick={() => onCustomerChange('')}
        >
          <div className={styles.customerOptionIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <span>{t('sales:stepCustomer.noCustomer')}</span>
        </button>

        <button
          type="button"
          className={`${styles.customerOption} ${customerId ? styles.customerOptionActive : ''}`}
          onClick={() => { if (!customerId && customers.length > 0) onCustomerChange(customers[0].id); }}
        >
          <div className={styles.customerOptionIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span>{t('sales:stepCustomer.selectCustomer')}</span>
        </button>

        <button
          type="button"
          className={styles.customerOption}
          onClick={onOpenCustomerModal}
        >
          <div className={styles.customerOptionIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>{t('sales:stepCustomer.addNewCustomer')}</span>
        </button>
      </div>

      {customerId !== '' && (
        <>
          <div className={styles.customerSearch}>
            <Input
              placeholder={t('sales:stepCustomer.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>

          <div className={styles.customerList}>
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className={`${styles.customerCard} ${customer.id === customerId ? styles.customerCardActive : ''}`}
                onClick={() => onCustomerChange(customer.id)}
              >
                <div className={styles.customerCardName}>{customer.name}</div>
                <div className={styles.customerCardDetails}>
                  {customer.phone && <span>{customer.phone}</span>}
                  {customer.email && <span>{customer.email}</span>}
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className={styles.emptyItems}>{t('sales:stepCustomer.notFound')}</div>
            )}
          </div>
        </>
      )}

      {selectedCustomer && (
        <Card className={styles.selectedCustomerCard}>
          <h4>{t('sales:stepCustomer.selectedCustomer')}</h4>
          <div className={styles.customerInfo}>
            <div><strong>{selectedCustomer.name}</strong></div>
            {selectedCustomer.phone && <div>{t('sales:stepCustomer.labels.phone')}: {selectedCustomer.phone}</div>}
            {selectedCustomer.email && <div>{t('sales:stepCustomer.labels.email')}: {selectedCustomer.email}</div>}
            {selectedCustomer.tax_number && <div>{t('sales:stepCustomer.labels.taxNumber')}: {selectedCustomer.tax_number}</div>}
            {selectedCustomer.tax_office && <div>{t('sales:stepCustomer.labels.taxOffice')}: {selectedCustomer.tax_office}</div>}
            {selectedCustomer.address && <div>{t('sales:stepCustomer.labels.address')}: {selectedCustomer.address}</div>}
          </div>
        </Card>
      )}
    </div>
  );
}
