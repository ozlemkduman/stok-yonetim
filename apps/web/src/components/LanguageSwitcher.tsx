import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr';

  const toggle = () => {
    i18n.changeLanguage(currentLang === 'tr' ? 'en' : 'tr');
  };

  return (
    <button className={styles.switcher} onClick={toggle} aria-label="Switch language">
      <span className={currentLang === 'tr' ? styles.active : styles.inactive}>TR</span>
      <span className={styles.divider}>|</span>
      <span className={currentLang === 'en' ? styles.active : styles.inactive}>EN</span>
    </button>
  );
}
