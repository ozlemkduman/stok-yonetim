import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useIsMobile } from '@stok/ui';
import styles from './MainLayout.module.css';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'Ana Sayfa',
    icon: 'home',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    ],
  },
  {
    id: 'sales',
    label: 'Satis Yonetimi',
    icon: 'shopping',
    items: [
      { path: '/customers', label: 'Musteriler', icon: 'people' },
      { path: '/quotes', label: 'Teklifler', icon: 'description' },
      { path: '/sales', label: 'Satislar', icon: 'receipt' },
      { path: '/returns', label: 'Iadeler', icon: 'undo' },
    ],
  },
  {
    id: 'inventory',
    label: 'Stok Yonetimi',
    icon: 'inventory',
    items: [
      { path: '/products', label: 'Urunler', icon: 'category' },
      { path: '/warehouses', label: 'Depolar', icon: 'warehouse' },
    ],
  },
  {
    id: 'finance',
    label: 'Finans',
    icon: 'payments',
    items: [
      { path: '/accounts', label: 'Kasa/Banka', icon: 'account_balance' },
      { path: '/expenses', label: 'Giderler', icon: 'money_off' },
      { path: '/e-documents', label: 'e-Belgeler', icon: 'article' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Saha',
    icon: 'groups',
    items: [
      { path: '/crm', label: 'CRM', icon: 'contact_phone' },
      { path: '/field-team', label: 'Saha Ekip', icon: 'directions_car' },
      { path: '/integrations', label: 'Entegrasyonlar', icon: 'sync' },
    ],
  },
  {
    id: 'reports',
    label: 'Raporlar',
    icon: 'analytics',
    items: [
      { path: '/reports', label: 'Raporlar', icon: 'bar_chart' },
    ],
  },
];

const iconMap: Record<string, string> = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  shopping: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  description: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  receipt: 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  category: 'M12 2l-5.5 9h11z M17.5 17.5h5v5h-5z M6.5 12.5a5 5 0 1 0 0 10 5 5 0 1 0 0-10z',
  inventory: 'M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.02V7z',
  warehouse: 'M22 21V10l-7-3V3H3v18h6v-4h6v4h7zm-10-7H8v-2h4v2zm0-4H8V8h4v2z',
  payments: 'M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z',
  account_balance: 'M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-5-9L2 6v2h20V6z',
  money_off: 'M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-.53.12-1.03.3-1.48.54l1.47 1.47c.41-.17.91-.27 1.51-.27zM5.33 4.06L4 5.39l2.77 2.77c-.23.59-.77 1.22-.77 2.09 0 1.95 1.35 3.18 3.5 3.67v3.08c-1.05-.2-2-.66-2.72-1.43l-1.63 1.63c1.1 1.08 2.69 1.76 4.35 1.96V21h3v-2.07c.85-.15 1.58-.46 2.17-.9l2.72 2.72 1.33-1.33L5.33 4.06zM12.5 18c-1.61 0-2.5-.71-2.5-1.86v-.93l3.54 3.54c-.35.14-.73.25-1.04.25z',
  article: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  groups: 'M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z',
  contact_phone: 'M22 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 1.99-.9 1.99-2L24 5c0-1.1-.9-2-2-2zM8 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H2v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1zm3.85-4h1.64L21 16l-1.99 1.99c-1.31-.98-2.28-2.38-2.73-3.99-.18-.64-.28-1.31-.28-2s.1-1.36.28-2c.45-1.62 1.42-3.01 2.73-3.99L21 8l-1.51 2h-1.64c-.22.63-.35 1.3-.35 2s.13 1.37.35 2z',
  directions_car: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  sync: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  analytics: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  bar_chart: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const path = iconMap[name];
  if (!path) return null;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

export function MainLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main', 'sales', 'inventory', 'finance']);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => isMobile && setSidebarOpen(false);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some((item) => location.pathname === item.path);
  };

  return (
    <div className={styles.layout}>
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>StokPro</span>
              <span className={styles.logoSubtitle}>Yonetim Sistemi</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {menuGroups.map((group) => (
            <div key={group.id} className={styles.menuGroup}>
              {group.items.length === 1 ? (
                <NavLink
                  to={group.items[0].path}
                  className={({ isActive }) =>
                    `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <Icon name={group.items[0].icon} size={20} />
                  <span className={styles.menuLabel}>{group.items[0].label}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    className={`${styles.groupHeader} ${isGroupActive(group) ? styles.groupHeaderActive : ''}`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className={styles.groupHeaderLeft}>
                      <Icon name={group.icon} size={18} />
                      <span>{group.label}</span>
                    </div>
                    <svg
                      className={`${styles.chevron} ${expandedGroups.includes(group.id) ? styles.chevronOpen : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                  <div
                    className={`${styles.groupItems} ${expandedGroups.includes(group.id) ? styles.groupItemsOpen : ''}`}
                  >
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `${styles.menuItem} ${styles.menuItemNested} ${isActive ? styles.menuItemActive : ''}`
                        }
                        onClick={closeSidebar}
                      >
                        <Icon name={item.icon} size={18} />
                        <span className={styles.menuLabel}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>A</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>Admin</span>
              <span className={styles.userRole}>Yonetici</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* TopBar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.menuButton}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.searchBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input type="text" placeholder="Ara..." className={styles.searchInput} />
            </div>
            <button className={styles.iconButton}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className={styles.badge}>3</span>
            </button>
            <div className={styles.dateTime}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
