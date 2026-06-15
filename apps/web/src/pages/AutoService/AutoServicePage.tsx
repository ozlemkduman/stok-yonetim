import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { autoServiceApi, Vehicle, ServiceOrder, CreateServiceOrderData } from '../../api/autoService.api';
import { VehiclesTab } from './VehiclesTab';
import { ServiceOrdersTab } from './ServiceOrdersTab';
import { ServiceOrderFormModal } from './ServiceOrderFormModal';
import { ServiceHistoryModal } from './ServiceHistoryModal';
import { useToast } from '../../context/ToastContext';
import styles from './AutoService.module.css';

type MainTab = 'vehicles' | 'orders';

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

  const openNewOrder = (vehicleId?: string) => {
    setEditingOrder(null);
    setPresetVehicleId(vehicleId);
    setHistoryVehicle(null); // geçmişten açıldıysa onu kapat
    setOrderModalOpen(true);
  };

  const openEditOrder = (order: ServiceOrder) => {
    setEditingOrder(order);
    setPresetVehicleId(undefined);
    setHistoryVehicle(null);
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

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.mainTabs}>
          {(['vehicles', 'orders'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              className={`${styles.mainTab} ${mainTab === tab ? styles.mainTabActive : ''}`}
              onClick={() => setMainTab(tab)}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {mainTab === 'vehicles' ? (
          <VehiclesTab onOpenHistory={setHistoryVehicle} />
        ) : (
          <ServiceOrdersTab
            refreshSignal={refreshSignal}
            onNewOrder={() => openNewOrder()}
            onEditOrder={openEditOrder}
          />
        )}
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
    </div>
  );
}
