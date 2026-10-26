import { useState, useEffect } from 'react';

interface HeaderProps {
  currentLang: 'en' | 'bn';
  onLangChange: (lang: 'en' | 'bn') => void;
  seller?: any;
  onOpenDashboard?: () => void;
}

export default function Header({ currentLang, onLangChange, seller, onOpenDashboard }: HeaderProps) {
  const [solid, setSolid] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setSolid(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`page-header ${solid ? 'scrolled' : ''}`}>
      <div className="header-center">
        {/* Packbang Custom SVG Logo */}
        <a href="#" className="header-logo-link" aria-label="Packbang Seller Center">
          <svg className="packbang-logo-icon" viewBox="0 0 170 40" fill="none">
            {/* Packaging Box / Package Icon */}
            <path d="M18 4L4 12V28L18 36L32 28V12L18 4Z" fill="#F85606" />
            <path d="M18 4L32 12L18 20L4 12L18 4Z" fill="#FF7A33" />
            <path d="M18 20V36L4 28V12L18 20Z" fill="#E04600" />
            <path d="M18 20L32 12V28L18 36V20Z" fill="#F85606" />
            {/* Box tape accent */}
            <path d="M14 6L22 10.5M14 18L22 22.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />

            {/* Wordmark: packbang */}
            <text x="40" y="27" fontFamily="'Roboto', sans-serif" fontSize="22" fontWeight="900" fill="#07002F" letterSpacing="-0.5">packbang</text>
          </svg>
        </a>

        {/* Navigation & Utilities (Desktop) */}
        <nav className="header-center-navs desktop-only-nav">
          <div className="header-center-navs-content">
            <a href="#support">
              <span>{currentLang === 'bn' ? 'প্যাকব্যাং একাডেমি' : 'Packaging Academy'}</span>
              <span className="new-badge">NEW</span>
            </a>
          </div>

          <div className="header-center-navs-content">
            <a href="#faq">
              <span>{currentLang === 'bn' ? 'সাপোর্ট ও সাহায্য' : 'Help Center'}</span>
            </a>
          </div>

          {/* Dashboard Button */}
          {seller && (
            <div className="header-center-navs-content">
              <button
                type="button"
                onClick={onOpenDashboard}
                style={{
                  background: 'var(--pb-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📦</span>
                <span>{currentLang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </button>
            </div>
          )}

          <div className={`dada-switch-language ${langOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="country-button-element"
              onClick={() => setLangOpen(!langOpen)}
            >
              <span className="icon-lang"></span>
              <span>{currentLang === 'bn' ? 'বাংলা' : 'English'}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {langOpen && (
              <div className="language-menu">
                <button
                  type="button"
                  className={`lang-opt ${currentLang === 'en' ? 'active' : ''}`}
                  onClick={() => { onLangChange('en'); setLangOpen(false); }}
                >
                  English (BD)
                </button>
                <button
                  type="button"
                  className={`lang-opt ${currentLang === 'bn' ? 'active' : ''}`}
                  onClick={() => { onLangChange('bn'); setLangOpen(false); }}
                >
                  বাংলা (Bengali)
                </button>
              </div>
            )}
          </div>

          {/* Country Flag */}
          <div className="country-button-wrap">
            <div className="country-button">
              <svg className="country-flag" viewBox="0 0 20 12" width="22" height="13" style={{ borderRadius: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
                <rect width="20" height="12" fill="#006A4E" />
                <circle cx="9" cy="6" r="4" fill="#F42A41" />
              </svg>
              <span className="country-label">Bangladesh</span>
            </div>
          </div>
        </nav>

        {/* Mobile Header Actions */}
        <div className="mobile-header-actions">
          {seller && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="btn-mobile-dash"
            >
              📦 {currentLang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </button>
          )}

          <button
            type="button"
            className="mobile-header-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-top">
              <span className="mobile-drawer-brand">PACKBANG SELLER</span>
              <button 
                type="button" 
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-body">
              {seller ? (
                <div className="mobile-drawer-user-card">
                  <div className="mobile-drawer-user-avatar">
                    {(seller.shopName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="mobile-drawer-shop-name">{seller.shopName}</div>
                    <div className="mobile-drawer-phone">{seller.phone}</div>
                  </div>
                </div>
              ) : null}

              <div className="mobile-drawer-links">
                {seller && (
                  <button
                    type="button"
                    onClick={() => { onOpenDashboard?.(); setMobileMenuOpen(false); }}
                    className="mobile-drawer-link-btn"
                  >
                    📦 {currentLang === 'bn' ? 'সেলার ড্যাশবোর্ড' : 'Seller Dashboard'}
                  </button>
                )}
                
                <a 
                  href="#support" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-drawer-link"
                >
                  🎓 {currentLang === 'bn' ? 'প্যাকব্যাং একাডেমি' : 'Packaging Academy'}
                </a>

                <a 
                  href="#faq" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-drawer-link"
                >
                  ❓ {currentLang === 'bn' ? 'সাপোর্ট ও সাহায্য' : 'Help Center'}
                </a>
              </div>

              <div className="mobile-drawer-footer">
                <div className="mobile-drawer-lang-selector">
                  <button
                    type="button"
                    className={`lang-pill ${currentLang === 'en' ? 'active' : ''}`}
                    onClick={() => { onLangChange('en'); setMobileMenuOpen(false); }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-pill ${currentLang === 'bn' ? 'active' : ''}`}
                    onClick={() => { onLangChange('bn'); setMobileMenuOpen(false); }}
                  >
                    বাংলা
                  </button>
                </div>
                <div className="mobile-drawer-country">
                  <svg viewBox="0 0 20 12" width="20" height="12" style={{ borderRadius: '2px' }}>
                    <rect width="20" height="12" fill="#006A4E" />
                    <circle cx="9" cy="6" r="4" fill="#F42A41" />
                  </svg>
                  <span>Bangladesh (BD)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
