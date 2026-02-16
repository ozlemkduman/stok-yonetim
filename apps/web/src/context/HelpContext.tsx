import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from '@stok/ui';
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
        <Modal
          isOpen={isOpen}
          onClose={closeHelp}
          title={content.title}
          size="md"
        >
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', listStyle: 'disc' }}>
            {content.items.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </Modal>
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
