import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@stok/ui';
import { reportsApi } from '../api/reports.api';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { usePermissions } from '../hooks/usePermissions';
import styles from './MainLayout.module.css';

interface MenuItem {
  path: string;
  label: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'Ana Sayfa',
    items: [
      { path: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    id: 'sales',
    label: 'Satis Yonetimi',
    items: [
      { path: '/customers', label: 'Musteriler' },
      { path: '/quotes', label: 'Teklifler' },
      { path: '/sales', label: 'Satislar' },
      { path: '/returns', label: 'Iadeler' },
    ],
  },
  {
    id: 'inventory',
    label: 'Stok Yonetimi',
    items: [
      { path: '/products', label: 'Urunler' },
      { path: '/warehouses', label: 'Depolar' },
    ],
  },
  {
    id: 'finance',
    label: 'Finans',
    items: [
      { path: '/accounts', label: 'Kasa/Banka' },
      { path: '/expenses', label: 'Giderler' },
      { path: '/e-documents', label: 'e-Belgeler' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Saha',
    items: [
      { path: '/crm', label: 'CRM' },
      { path: '/field-team', label: 'Saha Ekip' },
      { path: '/integrations', label: 'Entegrasyonlar' },
    ],
  },
  {
    id: 'reports',
    label: 'Raporlar',
    items: [
      { path: '/reports', label: 'Raporlar' },
    ],
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    items: [
      { path: '/settings', label: 'Sirket Ayarlari' },
      { path: '/settings/users', label: 'Kullanicilar' },
      { path: '/profile', label: 'Profil' },
    ],
  },
];


interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  link?: string;
}

export function MainLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { impersonatedTenant, isImpersonating, stopImpersonating } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch notifications (overdue payments, low stock, etc.)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [overdueRes, stockRes] = await Promise.all([
          reportsApi.getOverduePayments(),
          reportsApi.getStockReport(),
        ]);

        const newNotifications: Notification[] = [];

        // Overdue payments
        if (overdueRes.data.totalCount > 0) {
          newNotifications.push({
            id: 'overdue',
            type: 'danger',
            title: 'Geciken Odemeler',
            message: `${overdueRes.data.totalCount} adet geciken odeme var`,
            link: '/reports',
          });
        }

        // Low stock
        if (stockRes.data.summary.lowStockCount > 0) {
          newNotifications.push({
            id: 'lowstock',
            type: 'warning',
            title: 'Dusuk Stok',
            message: `${stockRes.data.summary.lowStockCount} urun stok seviyesi dusuk`,
            link: '/reports',
          });
        }

        // Out of stock
        if (stockRes.data.summary.outOfStockCount > 0) {
          newNotifications.push({
            id: 'outofstock',
            type: 'danger',
            title: 'Stok Bitti',
            message: `${stockRes.data.summary.outOfStockCount} urun stokta yok`,
            link: '/products',
          });
        }

        setNotifications(newNotifications);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

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
                  <span className={styles.menuLabel}>{group.items[0].label}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    className={`${styles.groupHeader} ${isGroupActive(group) ? styles.groupHeaderActive : ''}`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span>{group.label}</span>
                    <svg
                      className={`${styles.chevron} ${expandedGroups.includes(group.id) ? styles.chevronOpen : ''}`}
                      width="14"
                      height="14"
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
          {isSuperAdmin() && (
            <NavLink to="/admin" className={styles.adminLink}>
              Admin Panel
            </NavLink>
          )}
          <div className={styles.userInfo} ref={userMenuRef}>
            <button className={styles.userButton} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.name || 'Kullanici'}</span>
                <span className={styles.userRole}>{user?.tenant?.name || user?.role}</span>
              </div>
              <svg
                className={`${styles.chevronIcon} ${showUserMenu ? styles.chevronOpen : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            {showUserMenu && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <span className={styles.userMenuName}>{user?.name}</span>
                  <span className={styles.userMenuEmail}>{user?.email}</span>
                </div>
                <div className={styles.userMenuDivider} />
                <NavLink to="/profile" className={styles.userMenuItem} onClick={() => setShowUserMenu(false)}>
                  <span>👤</span> Profil
                </NavLink>
                <NavLink to="/settings" className={styles.userMenuItem} onClick={() => setShowUserMenu(false)}>
                  <span>⚙️</span> Ayarlar
                </NavLink>
                <div className={styles.userMenuDivider} />
                <button className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`} onClick={handleLogout}>
                  <span>🚪</span> Cikis Yap
                </button>
              </div>
            )}
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
            <div className={styles.notificationWrapper} ref={notificationRef}>
              <button
                className={styles.iconButton}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {notifications.length > 0 && (
                  <span className={styles.badge}>{notifications.length}</span>
                )}
              </button>
              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <span>Bildirimler</span>
                    {notifications.length > 0 && (
                      <span className={styles.notificationCount}>{notifications.length}</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className={styles.notificationEmpty}>
                      Bildirim yok
                    </div>
                  ) : (
                    <div className={styles.notificationList}>
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          className={`${styles.notificationItem} ${styles[`notification${n.type.charAt(0).toUpperCase() + n.type.slice(1)}`]}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={styles.notificationIcon}>
                            {n.type === 'danger' ? '!' : n.type === 'warning' ? '⚠' : 'i'}
                          </div>
                          <div className={styles.notificationContent}>
                            <strong>{n.title}</strong>
                            <span>{n.message}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.dateTime}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
          </div>
        </header>

        {/* Impersonation Banner */}
        {isImpersonating && impersonatedTenant && (
          <div className={styles.impersonationBanner}>
            <span>
              <strong>{impersonatedTenant.name}</strong> olarak goruntuluyorsunuz
            </span>
            <button
              onClick={() => {
                stopImpersonating();
                navigate('/admin');
              }}
              className={styles.impersonationButton}
            >
              Admin Paneline Don
            </button>
          </div>
        )}

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
