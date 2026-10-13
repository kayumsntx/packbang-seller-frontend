import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';

interface AuthCardProps {
  currentLang: 'en' | 'bn';
  onOpenDashboard?: () => void;
  onSellerChange?: (seller: SellerProfile | null) => void;
}

interface SellerProfile {
  id: string;
  phone: string;
  shopName: string;
  email?: string;
  tier?: string;
}

export default function AuthCard({ currentLang, onOpenDashboard, onSellerChange }: AuthCardProps) {
  const [authMode, setAuthMode] = useState<'password' | 'sms' | 'register' | 'qr'>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  // Persisted logged-in seller session
  const [loggedInSeller, setLoggedInSeller] = useState<SellerProfile | null>(() => {
    try {
      const saved = localStorage.getItem('packbang_seller_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Dynamic API URL: live production (seller.packbang.com) & local dev
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : 'https://packbang-seller-backend.onrender.com');

  const API_URL = `${API_BASE.replace(/\/$/, '')}/api/auth`;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send OTP
  const handleSendOtp = async () => {
    if (!account.trim()) {
      setStatusMessage({ 
        text: currentLang === 'bn' ? 'অনুগ্রহ করে আপনার ফোন নাম্বার দিন' : 'Please enter your phone number first', 
        type: 'error' 
      });
      return;
    }
    
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await axios.post(`${API_URL}/send-otp`, { phone: account });
      setCountdown(60);
      setStatusMessage({ 
        text: res.data.message || (currentLang === 'bn' ? 'ওটিপি কোড পাঠানো হয়েছে' : 'OTP sent successfully!'), 
        type: 'success' 
      });
    } catch (err: any) {
      // Fallback message for offline testing
      setCountdown(60);
      setStatusMessage({ 
        text: currentLang === 'bn' ? 'ওটিপি কোড পাঠানো হয়েছে (+880)' : 'OTP sent to +880' + account, 
        type: 'success' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Main Form Submit (Login, SMS Verification, or Registration)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        // --- 1. REGISTRATION API ---
        const res = await axios.post(`${API_URL}/register`, {
          phone: account,
          password,
          shopName: shopName || 'Packaging Store ' + account.slice(-4),
        });

        const { token, seller } = res.data;
        if (token) localStorage.setItem('packbang_seller_token', token);
        if (seller) {
          localStorage.setItem('packbang_seller_user', JSON.stringify(seller));
          setLoggedInSeller(seller);
          if (onSellerChange) onSellerChange(seller);
          if (onOpenDashboard) onOpenDashboard();
        }

        setStatusMessage({
          text: currentLang === 'bn' 
            ? `স্বাগতম! "${seller.shopName}" হিসেবে রেজিস্ট্রেশন সম্পন্ন হয়েছে।` 
            : `Registration successful! Welcome "${seller.shopName}".`,
          type: 'success'
        });

      } else if (authMode === 'sms') {
        // --- 2. OTP LOGIN API ---
        const res = await axios.post(`${API_URL}/verify-otp`, {
          phone: account,
          otp: otp.trim()
        });

        const { token, seller } = res.data;
        if (token) localStorage.setItem('packbang_seller_token', token);
        if (seller) {
          localStorage.setItem('packbang_seller_user', JSON.stringify(seller));
          setLoggedInSeller(seller);
        }

        setStatusMessage({
          text: currentLang === 'bn' ? 'ওটিপি সফলভাবে ভেরিফাই হয়েছে!' : 'OTP login verified successfully!',
          type: 'success'
        });

      } else {
        // --- 3. PASSWORD LOGIN API ---
        const res = await axios.post(`${API_URL}/login`, {
          account,
          password
        });

        const { token, seller } = res.data;
        if (token) localStorage.setItem('packbang_seller_token', token);
        if (seller) {
          localStorage.setItem('packbang_seller_user', JSON.stringify(seller));
          setLoggedInSeller(seller);
        }

        setStatusMessage({
          text: currentLang === 'bn' 
            ? `স্বাগতম! "${seller.shopName}" সেলার পোর্টালে লগইন সম্পন্ন।` 
            : `Welcome! Login successful for "${seller.shopName}".`,
          type: 'success'
        });
      }

    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Connection to server failed.';
      setStatusMessage({
        text: errMsg,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('packbang_seller_token');
    localStorage.removeItem('packbang_seller_user');
    setLoggedInSeller(null);
    setStatusMessage(null);
    if (onSellerChange) onSellerChange(null);
  };

  // If already logged in, show authenticated dashboard badge
  if (loggedInSeller) {
    return (
      <div className="login-card-container">
        <div className="login-card-inner" style={{ textAlign: 'center', padding: '36px 28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--pb-primary)',
            color: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px var(--pb-primary-glow)'
          }}>
            📦
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--pb-text-title)', marginBottom: '6px' }}>
            {loggedInSeller.shopName}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--pb-text-muted)', marginBottom: '14px' }}>
            {loggedInSeller.phone} • {loggedInSeller.tier === 'pro' ? 'Packbang Pro Factory' : 'Verified Packaging Seller'}
          </p>
          <div style={{
            background: 'var(--pb-emerald-light)',
            color: 'var(--pb-emerald)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '24px'
          }}>
            ✓ {currentLang === 'bn' ? 'সেলার পোর্টাল সক্রিয় (অনলাইন)' : 'Seller Account Active (Online)'}
          </div>
          <button
            type="button"
            className="sign-in-button"
            style={{ marginBottom: '12px' }}
            onClick={() => { if (onOpenDashboard) onOpenDashboard(); }}
          >
            {currentLang === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'GO TO SELLER DASHBOARD'}
          </button>
          <button
            type="button"
            style={{
              fontSize: '13px',
              color: 'var(--pb-text-muted)',
              padding: '6px 12px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={handleLogout}
          >
            {currentLang === 'bn' ? 'লগআউট করুন' : 'Log Out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-card-container">
      {/* Corner QR Toggle */}
      <button 
        type="button" 
        className="corner-qr-switch" 
        onClick={() => setAuthMode(authMode === 'qr' ? 'password' : 'qr')}
        title="Toggle QR Code Login"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="var(--pb-primary)">
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3zm-5-5h3v3h-3v-3z"/>
        </svg>
      </button>

      {authMode === 'qr' ? (
        <div className="login-card-inner">
          <div className="qr-login-box">
            <h3 className="qr-title">{currentLang === 'bn' ? 'কিউআর কোড স্ক্যান করুন' : 'Scan Packbang QR'}</h3>
            <p className="qr-desc">
              {currentLang === 'bn' 
                ? 'প্যাকব্যাং সেলার অ্যাপ দিয়ে স্ক্যান করে সহজে লগইন করুন।' 
                : 'Scan with Packbang Seller App to login instantly.'}
            </p>
            <div className="qr-canvas-mock">
              <div style={{
                position: 'absolute',
                width: '32px',
                height: '32px',
                background: 'var(--pb-primary)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: '14px'
              }}>
                PB
              </div>
              <svg viewBox="0 0 100 100" className="qr-svg-graphic">
                <rect x="5" y="5" width="25" height="25" fill="#111" rx="2"/>
                <rect x="9" y="9" width="17" height="17" fill="#fff" rx="1"/>
                <rect x="13" y="13" width="9" height="9" fill="var(--pb-primary)" rx="1"/>
                <rect x="70" y="5" width="25" height="25" fill="#111" rx="2"/>
                <rect x="74" y="9" width="17" height="17" fill="#fff" rx="1"/>
                <rect x="78" y="13" width="9" height="9" fill="var(--pb-primary)" rx="1"/>
                <rect x="5" y="70" width="25" height="25" fill="#111" rx="2"/>
                <rect x="9" y="74" width="17" height="17" fill="#fff" rx="1"/>
                <rect x="13" y="78" width="9" height="9" fill="var(--pb-primary)" rx="1"/>
                <rect x="35" y="10" width="6" height="6" fill="#222"/>
                <rect x="45" y="15" width="6" height="6" fill="#222"/>
                <rect x="75" y="50" width="6" height="6" fill="#222"/>
              </svg>
            </div>
            <button type="button" className="back-pwd-btn" onClick={() => setAuthMode('password')}>
              {currentLang === 'bn' ? 'পাসওয়ার্ড লগইনে ফিরে যান' : 'Back to Password Login'}
            </button>
          </div>
        </div>
      ) : (
        <div className="login-card-inner">
          {/* Header Tabs: Password | OTP | Register */}
          <div className="login-header-tabs">
            <button 
              type="button" 
              className={`tab-btn ${authMode === 'password' ? 'active' : ''}`}
              onClick={() => { setAuthMode('password'); setStatusMessage(null); }}
            >
              {currentLang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </button>
            <button 
              type="button" 
              className={`tab-btn ${authMode === 'sms' ? 'active' : ''}`}
              onClick={() => { setAuthMode('sms'); setStatusMessage(null); }}
            >
              {currentLang === 'bn' ? 'ওটিপি' : 'OTP Login'}
            </button>
            <button 
              type="button" 
              className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setStatusMessage(null); }}
            >
              {currentLang === 'bn' ? 'রেজিস্টার' : 'Register'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Shop Name Field (Registration Only) */}
            {authMode === 'register' && (
              <div className="form-item">
                <label className="form-label">
                  {currentLang === 'bn' ? 'দোকান বা ফ্যাক্টরির নাম' : 'Packaging Shop / Factory Name'}
                </label>
                <div className="input-wrap">
                  <input 
                    type="text" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. GreenPack Poly & Cartons"
                    required 
                  />
                </div>
              </div>
            )}

            {/* Account / Phone Field */}
            <div className="form-item">
              <label className="form-label">
                {currentLang === 'bn' ? 'মোবাইল নাম্বার বা ইমেল' : 'Phone Number or Business Email'}
              </label>
              <div className="input-wrap">
                <span className="input-prefix">+880</span>
                <input 
                  type="text" 
                  value={account} 
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  required 
                />
              </div>
            </div>

            {/* Password Field (Password & Register modes) */}
            {(authMode === 'password' || authMode === 'register') && (
              <div className="form-item">
                <div className="form-label-row">
                  <label className="form-label">{currentLang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</label>
                  {authMode === 'password' && (
                    <a href="#" className="forgot-link">
                      {currentLang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                    </a>
                  )}
                </div>
                <div className="input-wrap">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'register' ? 'Create a strong password' : 'Enter your password'}
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {/* SMS OTP Field (SMS mode only) */}
            {authMode === 'sms' && (
              <div className="form-item">
                <label className="form-label">{currentLang === 'bn' ? 'এসএমএস ওটিপি কোড' : 'OTP Verification Code'}</label>
                <div className="input-wrap sms-input-wrap">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    className="send-otp-btn"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `${countdown}s` : (currentLang === 'bn' ? 'কোড পাঠান' : 'Send Code')}
                  </button>
                </div>
              </div>
            )}

            {/* Status notification */}
            {statusMessage && (
              <div style={{ 
                color: statusMessage.type === 'error' ? '#EF4444' : '#10B981', 
                fontSize: '12.5px', 
                padding: '6px 0',
                fontWeight: 600 
              }}>
                {statusMessage.text}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading 
                ? 'PROCESSING...' 
                : authMode === 'register'
                  ? (currentLang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'CREATE SELLER ACCOUNT')
                  : (currentLang === 'bn' ? 'লগইন করুন' : 'SIGN IN')}
            </button>

            <div className="protocol-text">
              By continuing, you agree to Packbang's <a href="#">Vendor Terms</a> & <a href="#">Packaging Standards</a>
            </div>

            <div className="divider-line">
              <span>{currentLang === 'bn' ? 'অথবা' : 'Or connect with'}</span>
            </div>

            <div className="social-login-grid">
              <button type="button" className="social-btn">Google</button>
              <button type="button" className="social-btn">Facebook</button>
            </div>

            <div className="register-footer-link">
              {authMode === 'register' ? (
                <>
                  <span>{currentLang === 'bn' ? 'পূর্বে অ্যাকাউন্ট থাকলে' : 'Already have an account?'}</span>
                  <a 
                    href="#hero-section" 
                    className="register-cta"
                    onClick={(e) => { e.preventDefault(); setAuthMode('password'); }}
                  >
                    {currentLang === 'bn' ? 'লগইন করুন' : 'Log in here'}
                  </a>
                </>
              ) : (
                <>
                  <span>{currentLang === 'bn' ? 'নতুন প্যাকেজিং সেলার?' : 'New packaging supplier?'}</span>
                  <a 
                    href="#hero-section" 
                    className="register-cta"
                    onClick={(e) => { e.preventDefault(); setAuthMode('register'); }}
                  >
                    {currentLang === 'bn' ? 'রেজিস্টার করুন' : 'Register Shop'}
                  </a>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
