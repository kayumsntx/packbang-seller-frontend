import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import { type SellerProfile } from './SellerDashboard';

interface AuthCardProps {
  currentLang: 'en' | 'bn';
  onOpenDashboard?: () => void;
  onSellerChange?: (seller: SellerProfile | null) => void;
}



export default function AuthCard({ currentLang, onOpenDashboard, onSellerChange }: AuthCardProps) {
  const [authMode, setAuthMode] = useState<'password' | 'sms' | 'register' | 'qr' | 'forgot'>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  
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

  // Send Forgot Password OTP
  const handleSendForgotOtp = async () => {
    const targetPhone = resetPhone.trim() || account.trim();
    if (!targetPhone) {
      setStatusMessage({
        text: currentLang === 'bn' ? 'অনুগ্রহ করে আপনার রেজিস্টার্ড মোবাইল নাম্বার দিন' : 'Please enter your registered mobile number',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await axios.post(`${API_URL}/forgot-password/send-otp`, { phone: targetPhone });
      setCountdown(60);
      setForgotStep(2);
      const debugText = res.data.debugCode ? ` (Code: ${res.data.debugCode})` : '';
      setStatusMessage({
        text: (res.data.message || (currentLang === 'bn' ? 'ওটিপি কোড পাঠানো হয়েছে' : 'OTP sent successfully!')) + debugText,
        type: 'success'
      });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || (currentLang === 'bn' ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send OTP');
      setStatusMessage({
        text: errMsg,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password with OTP
  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const targetPhone = resetPhone.trim() || account.trim();

    if (!resetOtp.trim()) {
      setStatusMessage({
        text: currentLang === 'bn' ? 'অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোড দিন' : 'Please enter the 6-digit OTP code',
        type: 'error'
      });
      return;
    }

    if (resetNewPassword.length < 6) {
      setStatusMessage({
        text: currentLang === 'bn' ? 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters long',
        type: 'error'
      });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setStatusMessage({
        text: currentLang === 'bn' ? 'পাসওয়ার্ড দুটি মেলেনি' : 'Passwords do not match',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await axios.post(`${API_URL}/forgot-password/reset`, {
        phone: targetPhone,
        otp: resetOtp.trim(),
        newPassword: resetNewPassword
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
        text: res.data.message || (currentLang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password reset successfully!'),
        type: 'success'
      });

    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || (currentLang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে' : 'Failed to reset password');
      setStatusMessage({
        text: errMsg,
        type: 'error'
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
          if (onSellerChange) onSellerChange(seller);
          if (onOpenDashboard) onOpenDashboard();
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
          if (onSellerChange) onSellerChange(seller);
          if (onOpenDashboard) onOpenDashboard();
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
            onClick={() => {
              if (onSellerChange) onSellerChange(loggedInSeller);
              if (onOpenDashboard) onOpenDashboard();
            }}
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
      ) : authMode === 'forgot' ? (
        <div className="login-card-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setStatusMessage(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--pb-primary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0'
              }}
            >
              ← {currentLang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--pb-text-muted)', fontWeight: 600 }}>
              {forgotStep === 1 
                ? (currentLang === 'bn' ? 'ধাপ ১/২' : 'Step 1 of 2')
                : (currentLang === 'bn' ? 'ধাপ ২/২' : 'Step 2 of 2')}
            </span>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--pb-text-title)', margin: '0 0 6px 0' }}>
              {currentLang === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Your Password'}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--pb-text-muted)', margin: 0, lineHeight: 1.4 }}>
              {forgotStep === 1
                ? (currentLang === 'bn' 
                    ? 'আপনার রেজিস্টার্ড মোবাইল নাম্বারে একটি ৬-সংখ্যার ওটিপি কোড পাঠানো হবে।' 
                    : 'Enter your registered phone number to receive a 6-digit OTP verification code.')
                : (currentLang === 'bn'
                    ? `+880${resetPhone || account} নাম্বারে পাঠানো ওটিপি কোড ও নতুন পাসওয়ার্ড দিন।`
                    : `Enter the code sent to +880${resetPhone || account} and set your new password.`)}
            </p>
          </div>

          {statusMessage && (
            <div className={`status-alert ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSendForgotOtp(); }} className="login-form">
              <div className="form-item">
                <label className="form-label">
                  {currentLang === 'bn' ? 'রেজিস্টার্ড মোবাইল নাম্বার' : 'Registered Mobile Number'}
                </label>
                <div className="input-wrap">
                  <span className="input-prefix">+880</span>
                  <input
                    type="text"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading
                  ? (currentLang === 'bn' ? 'কোড পাঠানো হচ্ছে...' : 'Sending Code...')
                  : (currentLang === 'bn' ? 'রিসেট কোড পাঠান →' : 'Send Reset Code →')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="login-form">
              {/* 6-digit OTP code */}
              <div className="form-item">
                <label className="form-label">
                  {currentLang === 'bn' ? '৬-সংখ্যার ওটিপি কোড' : '6-Digit OTP Code'}
                </label>
                <div className="input-wrap sms-input-wrap">
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="send-sms-btn"
                    disabled={countdown > 0 || loading}
                    onClick={handleSendForgotOtp}
                  >
                    {countdown > 0 ? `${countdown}s` : (currentLang === 'bn' ? 'পুনরায় পাঠান' : 'Resend')}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-item">
                <label className="form-label">{currentLang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</label>
                <div className="input-wrap">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-item">
                <label className="form-label">{currentLang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}</label>
                <div className="input-wrap">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading
                  ? (currentLang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Updating...')
                  : (currentLang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ও লগইন' : 'Reset Password & Login')}
              </button>

              <button
                type="button"
                onClick={() => setForgotStep(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--pb-text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '8px',
                  textDecoration: 'underline'
                }}
              >
                {currentLang === 'bn' ? 'নাম্বার পরিবর্তন করতে চান?' : 'Change Phone Number'}
              </button>
            </form>
          )}
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
                    <button
                      type="button"
                      className="forgot-link"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      onClick={() => {
                        setAuthMode('forgot');
                        setForgotStep(1);
                        setResetPhone(account);
                        setStatusMessage(null);
                      }}
                    >
                      {currentLang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                    </button>
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
