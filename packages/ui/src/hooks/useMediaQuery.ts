import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Predefined breakpoints
// Desktop: >1024px (default), Tablet: 768-1024px, Mobile: 480-767px, Small Mobile: <480px
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  notMobile: '(min-width: 768px)',
} as const;

export function useIsMobile(): boolean {
  return useMediaQuery(breakpoints.mobile);
}

export function useIsTablet(): boolean {
  return useMediaQuery(breakpoints.tablet);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(breakpoints.desktop);
}
