import AuthCard from './AuthCard';

interface HeroProps {
  currentLang: 'en' | 'bn';
  onOpenDashboard?: () => void;
  onSellerChange?: (seller: any) => void;
}

export default function Hero({ currentLang, onOpenDashboard, onSellerChange }: HeroProps) {
  return (
    <section className="page-banner" id="hero-section">
      <div className="packbang-login-content">
        <div className="registerAndBannerContent">
          <div className="positionAnchorPoint">
            
            {/* Left Column Copy & Packaging Metrics */}
            <div className="hero-left-col">
              <span className="hero-pill-badge">BANGLADESH'S #1 PACKAGING B2B & SELLER MARKETPLACE</span>
              <h1 className="bigTitleStyle">
                {currentLang === 'bn' ? (
                  <>আপনার প্যাকেজিং<br />ব্যবসা বাড়ান<br />প্যাকব্যাং-এর সাথে!</>
                ) : (
                  <>GROW YOUR<br />PACKAGING BUSINESS<br />WITH PACKBANG!</>
                )}
              </h1>
              <p className="bigSubTitleStyle">
                {currentLang === 'bn'
                  ? 'গিফট প্যাকেট, বাবল র‍্যাপ, কুরিয়ার পলি, শপিং ব্যাগ, স্টিকার ও কার্টন বক্স সরবরাহ করুন দেশব্যাপী হাজারো ই-কমার্স ও রিটেল মার্চেন্টের কাছে!'
                  : 'Supply gift packets, bubble wrap, courier poly mailers, shopping bags, custom stickers & boxes directly to thousands of online businesses across Bangladesh!'}
              </p>

              {/* 3 Metric Ribbon Tailored to Packaging */}
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <div className="stat-number">500<span className="stat-unit">K+</span></div>
                  <div className="stat-label">
                    {currentLang === 'bn' ? 'প্রতি মাসে প্যাকেজিং আইটেম ডেলিভারি' : 'Monthly Packaging Items Delivered'}
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="stat-number">15<span className="stat-unit">K+</span></div>
                  <div className="stat-label">
                    {currentLang === 'bn' ? 'প্যাকেজিং ক্রেতা ই-কমার্স শপ' : 'Active Online Stores Buying Packaging'}
                  </div>
                </div>
                <div className="hero-stat-card highlight">
                  <div className="stat-number">0<span className="stat-unit">%</span></div>
                  <div className="stat-label">
                    {currentLang === 'bn' ? 'নতুন সেলারদের জন্য প্রথম ৩০ দিন ০% ফি' : '0% Platform commission for 30 days'}
                  </div>
                </div>
              </div>

              <div className="globalSellerContent">
                <span className="globalSellerTextStyle">
                  {currentLang === 'bn' ? 'বক্স ফ্যাক্টরি বা পাইকারি সরবরাহকারী?' : 'Factory Owner or Bulk Packaging Manufacturer?'}
                </span>
                <a href="#programs" className="globalSellerButtonStyle">
                  {currentLang === 'bn' ? 'বাল্ক ভেন্ডর রেজিস্টার' : 'Register Bulk Supplier'}
                </a>
              </div>
            </div>

            {/* Right Column Auth Card */}
            <div className="hero-right-col">
              <AuthCard currentLang={currentLang} onOpenDashboard={onOpenDashboard} onSellerChange={onSellerChange} />
            </div>

          </div>
        </div>
      </div>

      <a href="#benefits" className="scroll-down-hint">
        <span>{currentLang === 'bn' ? 'সুবিধাসমূহ দেখতে নিচে স্ক্রোল করুন' : 'Scroll down to explore packaging seller benefits'}</span>
        <span className="bounce-arrow">↓</span>
      </a>
    </section>
  );
}
