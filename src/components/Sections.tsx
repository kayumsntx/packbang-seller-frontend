import { useState } from 'react';

interface SectionsProps {
  currentLang: 'en' | 'bn';
}

export function HowItWorks({ currentLang }: SectionsProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  return (
    <section className="cms-section bg-warm" id="steps">
      <div className="section-container">
        <div className="steps-layout-grid">
          <div className="steps-left-col">
            <h2 className="section-title text-left">
              {currentLang === 'bn' ? 'প্যাকব্যাং-এ সেল শুরু করার সহজ ৪ ধাপ' : '4 Easy Steps to Start Selling Packaging'}
            </h2>
            <p className="steps-intro-text">
              {currentLang === 'bn' 
                ? 'প্যাকব্যাং-এ যুক্ত হয়ে আপনার প্যাকেজিং পণ্যের বিক্রি বাড়ান! ফ্যাক্টরি থেকে সরাসরি দেশব্যাপী ক্রেতাদের কাছে পৌঁছানোর দারুণ সুযোগ।' 
                : 'Join Packbang to expand your packaging business! Connect directly with thousands of eCommerce merchants needing daily boxes, poly bags, and bubble wrap.'}
            </p>
            <a href="#hero-section" className="steps-cta-button">
              {currentLang === 'bn' ? 'সেলার হিসেবে যোগ দিন' : 'Join as Seller'}
            </a>
          </div>

          <div className="steps-right-col">
            {[
              { 
                step: 1, 
                title: currentLang === 'bn' ? '১. ফোন নাম্বার দিয়ে অ্যাকাউন্ট খুলুন' : '1. Sign up with your phone number', 
                mins: '2', 
                desc: currentLang === 'bn' ? 'আপনার সচল মোবাইল নাম্বার দিন এবং ওটিপি দিয়ে ভেরিফাই করে প্যাকব্যাং সেলার প্রোফাইল তৈরি করুন।' : 'Verify your phone number with an instant OTP and set up your packaging seller profile.' 
              },
              { 
                step: 2, 
                title: currentLang === 'bn' ? '২. ফ্যাক্টরি বা ওয়্যারহাউজ ঠিকানা দিন' : '2. Provide workshop or warehouse address', 
                mins: '1', 
                desc: currentLang === 'bn' ? 'বাল্ক প্যাকেজিং ও কার্টন পিকআপের সুবিধার্থে আপনার ফ্যাক্টরি বা গোডাউনের সঠিক ঠিকানা ও ট্রেড লাইসেন্স সাবমিট করুন।' : 'Set your pickup warehouse or printing workshop address for seamless bulk packaging collection.' 
              },
              { 
                step: 3, 
                title: currentLang === 'bn' ? '৩. প্যাকেজিং ক্যাটালগ ও স্পেসিফিকেশন আপলোড করুন' : '3. Upload packaging catalog & specs', 
                mins: '5', 
                desc: currentLang === 'bn' ? 'গিফট প্যাকেট, বাবল র‍্যাপ রোল, কুরিয়ার পলি সাইজ (যেমন: 10x14, 12x16), শপিং ব্যাগ, স্টিকার ও বক্সের সাইজ, জিএসএম (GSM) ও মূল্য তালিকা যুক্ত করুন।' : 'List courier poly sizes, bubble wrap rolls, corrugated carton sizes, shopping bags, and custom printing options with wholesale tiers.' 
              },
              { 
                step: 4, 
                title: currentLang === 'bn' ? '৪. অর্ডার গ্রহণ করুন ও সাপ্তাহিক পেমেন্ট পান!' : '4. Receive bulk orders & get weekly payouts!', 
                mins: '10', 
                desc: currentLang === 'bn' ? 'অনলাইন শপ ও ব্র্যান্ডগুলো থেকে নিয়মিত বাল্ক অর্ডার পান। প্যাকব্যাং লজিস্টিক পণ্য সংগ্রহ করে পৌঁছে দেবে এবং প্রতি সপ্তাহে সরাসরি ব্যাংক অ্যাকাউন্টে টাকা পাবেন।' : 'Fulfill repeat bulk orders from eCommerce merchants. Packbang logistics handles deliveries, and payments are transferred to your bank every week.' 
              },
            ].map((s) => (
              <div key={s.step} className={`step-accordion-item ${activeStep === s.step ? 'active' : ''}`}>
                <div className="step-header" onClick={() => setActiveStep(activeStep === s.step ? 0 : s.step)}>
                  <div className="step-badge-number">{s.step}</div>
                  <div className="step-header-text">{s.title}</div>
                  <span className="step-duration">{s.mins} mins</span>
                  <span className="step-arrow">▼</span>
                </div>
                <div className="step-body">
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Benefits({ currentLang }: SectionsProps) {
  const benefitsList = [
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#FFF1EB" stroke="#FF5A1F" strokeWidth="2"/>
          <path d="M16 32L32 16" stroke="#FF5A1F" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="18" cy="18" r="3" fill="#FF5A1F"/>
          <circle cx="30" cy="30" r="3" fill="#FF5A1F"/>
        </svg>
      ),
      title: currentLang === 'bn' ? '০% প্ল্যাটফর্ম কমিশন' : '0% Commission (First 30 Days)',
      desc: currentLang === 'bn' ? 'নতুন প্যাকেজিং সেলারদের জন্য প্রথম ৩০ দিন কোনো প্ল্যাটফর্ম চার্জ নেই।' : 'Enjoy zero platform commission on all packaging item sales for your first 30 days.'
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2"/>
          <path d="M12 28V18C12 16.9 12.9 16 14 16H27V28H12Z" stroke="#16A34A" strokeWidth="2"/>
          <path d="M27 20H32.5L36 24V28H27V20Z" stroke="#16A34A" strokeWidth="2"/>
          <circle cx="17" cy="30" r="3" fill="#16A34A"/>
          <circle cx="31" cy="30" r="3" fill="#16A34A"/>
        </svg>
      ),
      title: currentLang === 'bn' ? 'দেশব্যাপী বাল্ক ডেলিভারি' : 'Nationwide Bulk Logistics',
      desc: currentLang === 'bn' ? 'ভারী কার্টন বক্স বা বাবল রোল—প্যাকব্যাং লজিস্টিক সারা দেশে পৌঁছে দেয় নিরাপদে।' : 'Seamless pickup & freight logistics for bulky boxes, bubble rolls, and heavy poly bundles.'
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2"/>
          <path d="M15 19H33L31 32H17L15 19Z" stroke="#2563EB" strokeWidth="2"/>
          <path d="M20 19V15C20 12.8 21.8 11 24 11C26.2 11 28 12.8 28 15V19" stroke="#2563EB" strokeWidth="2"/>
        </svg>
      ),
      title: currentLang === 'bn' ? 'হাজারো মার্চেন্টের বিশাল চাহিদা' : 'Massive Merchant Demand',
      desc: currentLang === 'bn' ? 'প্রতিদিন হাজার হাজার ই-কমার্স শপ তাদের পণ্যের জন্য কুরিয়ার পলি, বক্স ও প্যাকেট কিনছে।' : 'Direct access to eCommerce stores that place recurring orders for shipping bags & boxes weekly.'
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#FAF5FF" stroke="#9333EA" strokeWidth="2"/>
          <rect x="14" y="16" width="20" height="16" rx="2" stroke="#9333EA" strokeWidth="2"/>
          <path d="M14 22H34" stroke="#9333EA" strokeWidth="1.5" strokeDasharray="2 2"/>
          <path d="M20 28L28 28" stroke="#9333EA" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: currentLang === 'bn' ? 'কাস্টম সাইজ ও প্রিন্টিং সাপোর্ট' : 'Custom Sizes & Print Orders',
      desc: currentLang === 'bn' ? 'ব্র্যান্ডেড স্টিকার, লোগো প্রিন্টেড পলি এবং কাস্টম মেজারমেন্ট গিফট প্যাকেটের অর্ডার নেওয়ার সুযোগ।' : 'Offer customized sizes, client logo printing on poly mailers, and personalized gift boxes.'
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2"/>
          <path d="M30 18A9 9 0 0 0 16.5 22.5L14 20V26H20L17.5 23.5A7 7 0 0 1 28 20" fill="#D97706"/>
          <path d="M18 30A9 9 0 0 0 31.5 25.5L34 28V22H28L30.5 24.5A7 7 0 0 1 20 28" fill="#D97706"/>
        </svg>
      ),
      title: currentLang === 'bn' ? 'রিপিট ও পাইকারি অর্ডার' : 'High-Volume Repeat Orders',
      desc: currentLang === 'bn' ? 'প্যাকেজিং এমন একটি পণ্য যা প্রতি সপ্তাহে প্রয়োজন হয়, ফলে নিশ্চিত নিয়মিত বিক্রি।' : 'Packaging is a recurring consumable. Merchants subscribe and reorder stock continuously.'
    },
    {
      icon: (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" fill="#ECFDF5" stroke="#059669" strokeWidth="2"/>
          <rect x="14" y="18" width="20" height="12" rx="2" stroke="#059669" strokeWidth="2"/>
          <circle cx="24" cy="24" r="3" fill="#059669"/>
          <path d="M14 22H34" stroke="#059669" strokeWidth="1.5"/>
        </svg>
      ),
      title: currentLang === 'bn' ? 'নিশ্চিত সাপ্তাহিক ব্যাংক পেমেন্ট' : 'Weekly Direct Bank Payouts',
      desc: currentLang === 'bn' ? 'ডেলিভারিকৃত সব অর্ডারের পেমেন্ট সরাসরি প্রতি সপ্তাহে আপনার ব্যাংক একাউন্টে জমা হয়।' : 'Reliable weekly direct bank settlements with transparent accounting & zero hidden deductions.'
    }
  ];

  return (
    <section className="cms-section bg-subtle" id="benefits">
      <div className="section-container">
        <div className="section-header text-center">
          <div className="badge-pill mb-2">
            {currentLang === 'bn' ? 'কেন প্যাকব্যাং সেলার হবেন?' : 'Why Sell Packaging on Packbang?'}
          </div>
          <h2 className="section-title">
            {currentLang === 'bn' ? 'প্যাকেজিং সাপ্লায়ারদের এক নম্বর মার্কেটপ্লেস' : "Bangladesh's Leading B2B Packaging Hub"}
          </h2>
          <p className="section-subtitle">
            {currentLang === 'bn' 
              ? 'প্যাকেজিং প্রস্তুতকারক ও পাইকারি বিক্রেতাদের জন্য প্রস্তুতকৃত বিশেষ ব্যবসায়িক সুযোগ।' 
              : 'Built specifically to empower carton box manufacturers, poly extruders, and gift packet creators.'}
          </p>
        </div>

        <div className="benefits-grid">
          {benefitsList.map((b, i) => (
            <div key={i} className="benefit-card">
              <div className="benefit-icon-wrap">{b.icon}</div>
              <h3 className="benefit-card-title">{b.title}</h3>
              <p className="benefit-card-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SellerStory({ currentLang }: SectionsProps) {
  return (
    <section className="cms-section bg-white" id="stories">
      <div className="section-container">
        <div className="section-header-box">
          <h2 className="section-title">
            {currentLang === 'bn' ? 'সফল প্যাকেজিং উদ্যোক্তাদের গল্প' : "Packaging Sellers' Success Stories"}
          </h2>
          <p className="section-subtitle">
            {currentLang === 'bn'
              ? 'প্যাকব্যাং-এর মাধ্যমে কীভাবে সাধারণ বক্স ও পলি কারখানাগুলো ব্র্যান্ডে রূপান্তরিত হয়েছে।'
              : 'How local packet workshops and carton makers multiplied their sales nationwide through Packbang.'}
          </p>
        </div>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-media-wrap">
              <img src="/seller-rafiqul.jpg" alt="Rafiqul Islam" className="story-img" />
              <div className="play-video-btn">▶</div>
            </div>
            <div className="story-card-body">
              <div className="story-author-name">Rafiqul Islam</div>
              <div className="story-author-role">Founder, GreenPack Poly & Cartons</div>
              <p className="story-quote">
                {currentLang === 'bn'
                  ? '"পুরান ঢাকার ছোট প্রেস থেকে আজ আমরা প্যাকব্যাং-এর মাধ্যমে প্রতি সপ্তাহে ৫০,০০০+ কুরিয়ার পলি ব্যাগ এবং কাস্টম সাইজ কার্টন বক্স সরবরাহ করছি দেশের বিভিন্ন জেলার ব্র্যান্ডগুলোতে। বিক্রয় বেড়েছে চারগুণ!"'
                  : '"From a modest printing press in Old Dhaka, we now supply 50,000+ courier poly mailers and custom carton boxes every week to eCommerce brands across Bangladesh via Packbang."'}
              </p>
            </div>
          </div>
          <div className="story-card">
            <div className="story-media-wrap">
              <img src="/seller-sumaiya.jpg" alt="Sumaiya Jahan" className="story-img" />
              <div className="play-video-btn">▶</div>
            </div>
            <div className="story-card-body">
              <div className="story-author-name">Sumaiya Jahan</div>
              <div className="story-author-role">Owner, CraftGift & Bubble Solutions</div>
              <p className="story-quote">
                {currentLang === 'bn'
                  ? '"প্রিমিয়াম হ্যান্ডমেড গিফট প্যাকেট এবং হাই-গ্রেড বাবল র‍্যাপ রোল সরবরাহ করে প্যাকব্যাং-এ আমার যাত্রা শুরু। অনলাইনে বুটিক শপ এবং গিফট স্টোরগুলো আমাদের নিয়মিত ক্লায়েন্ট।"'
                  : '"Supplying premium gift packets, customized stickers, and protective bubble wrap on Packbang allowed us to secure repeat contracts with hundreds of boutique gift shops."'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Programs({ currentLang }: SectionsProps) {
  return (
    <section className="cms-section bg-dark-navy" id="programs">
      <div className="section-container">
        <div className="section-header-box light">
          <h2 className="section-title text-white">
            {currentLang === 'bn' ? "প্যাকব্যাং সাপ্লায়ার প্রোগ্রাম" : "Packbang Supplier Programs"}
          </h2>
          <p className="section-subtitle text-gray-300">
            {currentLang === 'bn'
              ? 'আপনার পণ্যের ধরন ও সক্ষমতা অনুযায়ী উপযুক্ত সেলার ক্যাটাগরি বেছে নিন।'
              : 'Choose the seller tier that matches your production capacity.'}
          </p>
        </div>
        <div className="programs-grid">
          {/* Tier 1: Standard Packaging Seller */}
          <div className="program-card">
            <div className="program-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#F85606', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontWeight: 900, fontSize: '18px' }}>
                PACKBANG
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Ready Stock Seller</span>
            </div>
            <p className="program-desc">
              {currentLang === 'bn'
                ? 'স্ট্যান্ডার্ড সাইজের কুরিয়ার পলি, বাবল র‍্যাপ রোল, সাধারণ কার্টন বক্স, শপিং ব্যাগ ও প্যাকেজিং টেপের রেডি স্টক সরবরাহকারীদের জন্য।'
                : 'For suppliers of ready-stock packaging: standard courier poly flyers, bubble rolls, generic shipping boxes & shopping bags.'}
            </p>
            <ul className="program-features-list">
              <li>✓ {currentLang === 'bn' ? 'রেডি স্টক থেকে দ্রুত ডেলিভারি' : 'Fast order dispatch from ready inventory'}</li>
              <li>✓ {currentLang === 'bn' ? 'সকল প্যাকেজিং আইটেমের জন্য উন্মুক্ত' : 'Sell all standard packaging categories'}</li>
              <li>✓ {currentLang === 'bn' ? 'প্রথম ৩০ দিন ০% প্ল্যাটফর্ম ফি' : '0% platform commission for initial 30 days'}</li>
            </ul>
            <a href="#hero-section" className="program-cta-btn primary">
              {currentLang === 'bn' ? 'রেজিস্টার করুন' : 'Sign Up Now'}
            </a>
          </div>

          {/* Tier 2: Custom Manufacturer */}
          <div className="program-card">
            <div className="program-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#FF7A33', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontWeight: 900, fontSize: '18px' }}>
                PACKBANG PRO
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Custom Manufacturer</span>
            </div>
            <p className="program-desc">
              {currentLang === 'bn'
                ? 'কাস্টম লোগো প্রিন্টেড পলি, ব্র্যান্ডেড কার্টন বক্স, ডাই-কাট গিফট প্যাকেট ও কাস্টম স্টিকার প্রস্তুতকারক ফ্যাক্টরি ও প্রেসের জন্য।'
                : 'For factories & presses offering customized branding: logo-printed poly mailers, branded corrugated mailer boxes, custom stickers & luxury gift packets.'}
            </p>
            <ul className="program-features-list">
              <li>✓ {currentLang === 'bn' ? 'কাস্টম এমওকিউ (MOQ) ও বাল্ক প্রাইসিং সেট করার সুবিধা' : 'Set custom MOQs, die-plate fees & bulk tiers'}</li>
              <li>✓ {currentLang === 'bn' ? 'প্যাকব্যাং প্রো ভেরিফায়েড ম্যানুফ্যাকচারার ব্যাজ' : 'Packbang Pro Verified Factory badge & top search rank'}</li>
              <li>✓ {currentLang === 'bn' ? 'মার্চেন্টদের সাথে সরাসরি কাস্টমাইজেশন যোগাযোগ' : 'Direct merchant chat for artwork & sample approval'}</li>
            </ul>
            <a href="#hero-section" className="program-cta-btn outline">
              {currentLang === 'bn' ? 'ম্যানুফ্যাকচারার হিসেবে যোগ দিন' : 'Register Factory Pro'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SupportHub({ currentLang }: SectionsProps) {
  return (
    <section className="cms-section bg-warm" id="support">
      <div className="section-container">
        <div className="section-header-box">
          <h2 className="section-title">
            {currentLang === 'bn' ? "প্যাকব্যাং সেলার সাপোর্ট ও রিসোর্স" : "Packbang Packaging Support Hub"}
          </h2>
          <p className="section-subtitle">
            {currentLang === 'bn'
              ? 'প্যাকেজিং পণ্যের সঠিক মান বজায় রাখা এবং দ্রুত ব্যবসা সম্প্রসারণের প্রয়োজনীয় গাইডলাইন।'
              : 'Everything you need to master packaging industry standards, pricing tiers, and client fulfillment.'}
          </p>
        </div>
        <div className="support-grid">
          <div className="support-card">
            <div className="support-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>📦</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#07002F' }}>Packbang Academy</h3>
            </div>
            <p className="support-desc">
              {currentLang === 'bn'
                ? 'কুরিয়ার পলির মাইক্রন থিকনেস, কার্টন বক্সের জিএসএম ও প্লাই স্পেকস, এবং বাবল র‍্যাপের মান নির্ধারণ সংক্রান্ত ফ্রি ট্রেনিং ও ভিডিও গাইড।'
                : 'Free training courses explaining courier poly micron thickness, carton flute & GSM standards, bubble roll grades, and wholesale pricing.'}
            </p>
            <a href="#faq" className="support-link-btn">
              {currentLang === 'bn' ? 'গাইডসমূহ দেখুন →' : 'Explore Academy Guides →'}
            </a>
          </div>
          <div className="support-card">
            <div className="support-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🤝</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#07002F' }}>Packbang Vendor Community</h3>
            </div>
            <p className="support-desc">
              {currentLang === 'bn'
                ? 'বাংলাদেশের শীর্ষ প্যাকেজিং প্রস্তুতকারক ও পাইকারি বিক্রেতাদের গ্রুপ। বাজার দর, কাঁচামালের আপডেট এবং বড় অর্ডারের অভিজ্ঞতা শেয়ার করুন।'
                : 'Connect with hundreds of paper box makers, poly extruders, and sticker printers to share raw material trends and industry insights.'}
            </p>
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="support-link-btn">
              {currentLang === 'bn' ? 'কমিউনিটিতে যোগ দিন →' : 'Join Vendor Community →'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq({ currentLang }: SectionsProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  return (
    <section className="cms-section bg-white" id="faq">
      <div className="section-container">
        <div className="section-header-box">
          <h2 className="section-title">
            {currentLang === 'bn' ? 'প্যাকেজিং সেলারদের সাধারণ জিজ্ঞাসা (FAQs)' : 'Frequently Asked Questions'}
          </h2>
          <p className="section-subtitle">
            {currentLang === 'bn'
              ? 'প্যাকব্যাং-এ প্যাকেজিং পণ্য বিক্রি সম্পর্কিত জরুরি প্রশ্নোত্তর।'
              : 'Answers to help you get your packaging workshop or shop live quickly.'}
          </p>
        </div>
        <div className="faq-accordion-wrap">
          {[
            { 
              q: currentLang === 'bn' ? 'প্যাকব্যাং-এ আমি কোন কোন প্যাকেজিং পণ্য বিক্রি করতে পারব?' : 'What packaging items can I sell on Packbang?', 
              a: currentLang === 'bn' ? 'আপনি গিফট প্যাকেট, বাবল র‍্যাপ (রোল ও শিট), কুরিয়ার পলি ব্যাগ (লোগোসহ বা প্লেইন), শপিং ব্যাগ (কাগজ, কাপড় বা জুট), প্রিন্টেড স্টিকার ও লেবেল, প্যাকেজিং টেপ এবং বিভিন্ন সাইজের কার্টন বক্স বিক্রি করতে পারবেন।' : 'You can sell gift packets, bubble wrap (rolls & pouches), courier poly mailers, shopping bags (paper, non-woven, jute), branded stickers/fragile labels, security tape, and all dimensions of corrugated shipping boxes.' 
            },
            { 
              q: currentLang === 'bn' ? 'আমি কি কাস্টম সাইজ এবং মার্চেন্টের লোগো প্রিন্ট করা পণ্য সেল করতে পারব?' : 'Can I offer custom sizes and customer logo printing?', 
              a: currentLang === 'bn' ? 'হ্যাঁ, প্যাকব্যাং-এ কাস্টম ম্যানুফ্যাকচারিং অপশন রয়েছে। আপনি মার্চেন্টের লোগো অনুযায়ী পলি ব্যাগ, স্টিকার ও বক্সের কাস্টম প্রিন্টিং অফার করতে পারবেন এবং ন্যূনতম অর্ডারের পরিমাণ (MOQ) নির্ধারণ করতে পারবেন।' : 'Yes! Packbang supports custom listings where you can set Minimum Order Quantities (MOQ), custom dimensions, GSM specs, and logo printing services for online stores.' 
            },
            { 
              q: currentLang === 'bn' ? 'ভারী পণ্য যেমন কার্টন বা বাবল রোলের ডেলিভারি কীভাবে হবে?' : 'How does delivery work for bulky items like boxes and bubble rolls?', 
              a: currentLang === 'bn' ? 'প্যাকব্যাং লজিস্টিক পার্টনার সরাসরি আপনার ফ্যাক্টরি বা গোডাউন থেকে বাল্ক প্যাকেজিং পণ্য পিকআপ করে ক্রেতার ঠিকানায় ডেলিভারি নিশ্চিত করে। বড় অর্ডারের জন্য বিশেষ মালবাহী গাড়ির সুবিধা রয়েছে।' : 'Packbang logistics collects heavy bundles and bulky bubble rolls directly from your warehouse or factory floor, handling nationwide freight to buyer destinations.' 
            },
            { 
              q: currentLang === 'bn' ? 'প্যাকব্যাং কত কমিশন চার্জ করে এবং পেমেন্ট কখন পাওয়া যায়?' : 'What is the commission rate and when do I get paid?', 
              a: currentLang === 'bn' ? 'অ্যাকাউন্ট খোলা সম্পূর্ণ ফ্রি! নতুন সেলাররা প্রথম ৩০ দিন উপভোগ করেন ০% কমিশন। প্রতিটি সফল ডেলিভারির পেমেন্ট প্রতি সপ্তাহে সরাসরি আপনার ব্যাংক অ্যাকাউন্টে পাঠিয়ে দেওয়া হয়।' : 'Joining is 100% free with 0% platform commission for your first 30 days. Payments for fulfilled packaging orders are settled weekly via direct bank transfer.' 
            },
          ].map((faq, idx) => (
            <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
              <button type="button" className="faq-question" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <span>{faq.q}</span>
                <span className="faq-chevron">▼</span>
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaRibbon({ currentLang }: SectionsProps) {
  return (
    <section className="getStartContent">
      <div className="getStartArea">
        <h2 className="getStartTitleStyle">
          {currentLang === 'bn' ? 'আজই শুরু করুন প্যাকব্যাং-এ প্যাকেজিং সাপ্লাই!' : 'Start Supplying Packaging on Packbang Today!'}
        </h2>
        <a href="#hero-section" className="getStartButtonStyle">
          {currentLang === 'bn' ? 'সেলার হোন' : 'GET STARTED'}
        </a>
      </div>
    </section>
  );
}

export function QuickMenuAndFab({ currentLang }: SectionsProps) {
  const [activeNav, setActiveNav] = useState('benefits');
  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <>
      <aside className="navigation-styles preview-navigation-fixed">
        <div className="quick-nav-title">{currentLang === 'bn' ? 'কুইক মেনু' : 'Quick Menu'}</div>
        <div className="quick-nav-content">
          {[
            { id: 'benefits', label: currentLang === 'bn' ? 'সুবিধা' : 'Benefits' },
            { id: 'steps', label: currentLang === 'bn' ? 'ধাপসমূহ' : 'Steps' },
            { id: 'stories', label: currentLang === 'bn' ? 'গল্প' : 'Stories' },
            { id: 'programs', label: currentLang === 'bn' ? 'প্রোগ্রাম' : 'Programs' },
            { id: 'support', label: currentLang === 'bn' ? 'সাপোর্ট' : 'Support' },
            { id: 'faq', label: currentLang === 'bn' ? 'প্রশ্নোত্তর' : 'FAQs' },
          ].map((item) => (
            <div
              key={item.id}
              className={`quick-nav-box ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </div>
          ))}
        </div>
      </aside>

      <a href="#steps" className="seller-hover-button">
        <span style={{ fontSize: '18px' }}>📦</span>
        <span>{currentLang === 'bn' ? 'প্যাকেজিং সেলার হোন' : 'BECOME A PACKAGING SELLER'}</span>
      </a>
    </>
  );
}
