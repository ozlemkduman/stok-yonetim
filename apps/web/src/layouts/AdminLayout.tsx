import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

const menuItems = [
  { path: '/admin', label: 'Özet', icon: '📊' },
  { path: '/admin/tenants', label: 'Organizasyonlar', icon: '🏢' },
  { path: '/admin/plans', label: 'Planlar', icon: '📋' },
  { path: '/admin/users', label: 'Kullanıcılar', icon: '👥' },
  { path: '/admin/invitations', label: 'Davetler', icon: '✉️' },
  { path: '/admin/logs', label: 'Aktivite Kayıtları', icon: '📜' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.logo}>
          <h1>Stok Sayaç</h1>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <NavLink to="/dashboard" className={styles.navLink}>
            <span className={styles.icon}>🏠</span>
            <span className={styles.label}>Ana Uygulamaya Dön</span>
          </NavLink>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.menuToggle}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>

          <div className={styles.headerRight}>
            <div className={styles.profileWrapper} ref={profileMenuRef}>
              <button
                className={styles.profileButton}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user?.name}</span>
                  <span className={styles.userRole}>Super Admin</span>
                </div>
                <svg
                  className={`${styles.chevron} ${showProfileMenu ? styles.chevronOpen : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              {showProfileMenu && (
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{user?.name || 'Admin'}</span>
                    <span className={styles.dropdownEmail}>{user?.email || 'admin@stokpro.com'}</span>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                  >
                    <span role="img" aria-label="profile">👤</span>
                    <span>Profil</span>
                  </button>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    <span role="img" aria-label="logout">🚪</span>
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
