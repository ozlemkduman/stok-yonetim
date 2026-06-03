import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpDrawer } from '../components/HelpDrawer';
import { getHelpContent } from '../data/helpContent';

interface HelpContextValue {
  openHelp: () => void;
  hasHelp: boolean;
}

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const content = getHelpContent(location.pathname);
  const hasHelp = content !== null;

  // Sayfa değişince paneli kapat
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const openHelp = useCallback(() => {
    if (content) {
      setIsOpen(true);
    }
  }, [content]);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <HelpContext.Provider value={{ openHelp, hasHelp }}>
      {children}
      {content && (
        <HelpDrawer isOpen={isOpen} onClose={closeHelp} title={content.title}>
          <ul style={{ margin: 0, padding: '0 0 0 1.1rem', listStyle: 'disc' }}>
            {content.items.map((item, i) => (
              <li key={i} style={{ marginBottom: '12px' }}>
                {item}
              </li>
            ))}
          </ul>
        </HelpDrawer>
      )}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
}
