import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { autoServiceApi, Vehicle, ServiceOrder, CreateServiceOrderData, RecordInvoiceData } from '../../api/autoService.api';
import { VehiclesTab } from './VehiclesTab';
import { ServiceOrdersTab } from './ServiceOrdersTab';
import { CustomersTab } from './CustomersTab';
import { EmployeesTab } from './EmployeesTab';
import { ProductsTab } from './ProductsTab';
import { ServiceOrderFormModal } from './ServiceOrderFormModal';
import { ServiceHistoryModal } from './ServiceHistoryModal';
import { InvoiceModal } from './InvoiceModal';
import { useToast } from '../../context/ToastContext';
import styles from './AutoService.module.css';

type MainTab = 'vehicles' | 'orders' | 'customers' | 'employees' | 'products';

const MAIN_TABS: MainTab[] = ['vehicles', 'orders', 'customers', 'employees', 'products'];

/**
 * Oto Servis modülü (Faz 2). business_type='auto_service' tenant'lara görünür
 * (SectorGate + sidebar). İki sekme: Araçlar ve İş Emirleri. İş emri formu ve
 * servis geçmişi modal'ı her iki sekmenin de tetikleyebilmesi için burada yaşar.
 */
export function AutoServicePage() {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();

  const [mainTab, setMainTab] = useState<MainTab>('vehicles');
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Servis geçmişi modal'ı
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);

  // İş emri formu
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [presetVehicleId, setPresetVehicleId] = useState<string | undefined>(undefined);

  // Fatura kaydı
  const [invoiceOrder, setInvoiceOrder] = useState<ServiceOrder | null>(null);

  const openNewOrder = (vehicleId?: string) => {
    setEditingOrder(null);
    setPresetVehicleId(vehicleId);
    setHistoryVehicle(null); // geçmişten açıldıysa onu kapat
    setOrderModalOpen(true);
  };

  const openEditOrder = async (order: ServiceOrder) => {
    setPresetVehicleId(undefined);
    setHistoryVehicle(null);
    // Liste kaydı parça kalemlerini içermez; tam siparişi (items dahil) çek,
    // aksi halde düzenlemede mevcut parçalar görünmez ve kaydedince silinirdi.
    try {
      const res = await autoServiceApi.serviceOrders.getById(order.id);
      setEditingOrder(res.data);
    } catch {
      setEditingOrder(order);
    }
    setOrderModalOpen(true);
  };

  const handleOrderSubmit = async (data: CreateServiceOrderData) => {
    if (editingOrder) {
      const { vehicle_id, ...rest } = data;
      void vehicle_id; // güncellemede araç değişmez
      await autoServiceApi.serviceOrders.update(editingOrder.id, rest);
      showToast('success', t('orders.toast.updateSuccess'));
    } else {
      await autoServiceApi.serviceOrders.create(data);
      showToast('success', t('orders.toast.createSuccess'));
    }
    setRefreshSignal((n) => n + 1);
  };

  const handleInvoiceSubmit = async (data: RecordInvoiceData) => {
    if (!invoiceOrder) return;
    await autoServiceApi.serviceOrders.recordInvoice(invoiceOrder.id, data);
    setRefreshSignal((n) => n + 1);
  };

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.mainTabs}>
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.mainTab} ${mainTab === tab ? styles.mainTabActive : ''}`}
              onClick={() => setMainTab(tab)}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {mainTab === 'vehicles' && <VehiclesTab onOpenHistory={setHistoryVehicle} />}
        {mainTab === 'orders' && (
          <ServiceOrdersTab
            refreshSignal={refreshSignal}
            onNewOrder={() => openNewOrder()}
            onEditOrder={openEditOrder}
            onInvoice={setInvoiceOrder}
          />
        )}
        {mainTab === 'customers' && <CustomersTab />}
        {mainTab === 'employees' && <EmployeesTab />}
        {mainTab === 'products' && <ProductsTab />}
      </div>

      <ServiceHistoryModal
        isOpen={!!historyVehicle}
        vehicle={historyVehicle}
        onClose={() => setHistoryVehicle(null)}
        onNewOrder={openNewOrder}
        onSelectOrder={openEditOrder}
      />

      <ServiceOrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSubmit={handleOrderSubmit}
        order={editingOrder}
        presetVehicleId={presetVehicleId}
      />

      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
        onSubmit={handleInvoiceSubmit}
      />
    </div>
  );
}
