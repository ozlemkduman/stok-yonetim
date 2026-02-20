interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
  dark?: boolean;
  className?: string;
}

export function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded square background */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logoGrad)" />

      {/* Bar chart bars */}
      <rect x="10" y="28" width="6" height="10" rx="1.5" fill="white" opacity="0.85" />
      <rect x="19" y="20" width="6" height="18" rx="1.5" fill="white" />
      <rect x="28" y="14" width="6" height="24" rx="1.5" fill="white" opacity="0.85" />

      {/* Upward arrow */}
      <path d="M36 24L40 16L44 24" stroke="white" strokeWidth="0" fill="none" />
      <path d="M34 12L39 7L44 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <line x1="39" y1="7" x2="39" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4361ee" />
          <stop offset="1" stopColor="#3a56d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const sizes = {
  sm: { icon: 32, title: '1.15rem', subtitle: '0.65rem', gap: '0.6rem' },
  md: { icon: 38, title: '1.35rem', subtitle: '0.72rem', gap: '0.7rem' },
  lg: { icon: 48, title: '1.8rem', subtitle: '0.85rem', gap: '0.75rem' },
};

export function Logo({ size = 'md', showText = true, subtitle, dark = false, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap,
        textDecoration: 'none',
      }}
    >
      <LogoIcon size={s.icon} />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span
            style={{
              fontSize: s.title,
              fontWeight: 800,
              color: dark ? '#fff' : '#1a1a2e',
              letterSpacing: '-0.02em',
            }}
          >
            Stok<span style={{ color: '#4361ee' }}>Sayaç</span>
          </span>
          {subtitle && (
            <span style={{ fontSize: s.subtitle, color: dark ? '#888' : '#999', fontWeight: 500 }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
