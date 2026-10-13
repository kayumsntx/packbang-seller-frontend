import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SellerDashboard, { type SellerProfile } from './components/SellerDashboard';
import { 
  Benefits, 
  HowItWorks, 
  SellerStory, 
  Programs, 
  SupportHub, 
  Faq, 
  CtaRibbon, 
  QuickMenuAndFab 
} from './components/Sections';
import Footer from './components/Footer';

export default function App() {
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>('en');
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [seller, setSeller] = useState<SellerProfile | null>(() => {
    try {
      const saved = localStorage.getItem('packbang_seller_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('packbang_seller_token');
    localStorage.removeItem('packbang_seller_user');
    setSeller(null);
    setCurrentView('landing');
  };

  // If user is viewing the dashboard
  if (currentView === 'dashboard' && seller) {
    return (
      <SellerDashboard
        seller={seller}
        currentLang={currentLang}
        onLogout={handleLogout}
        onGoLanding={() => setCurrentView('landing')}
        onLangChange={setCurrentLang}
      />
    );
  }

  return (
    <div className="packbang-theme">
      <Header
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        seller={seller}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />
      <main>
        <Hero
          currentLang={currentLang}
          onOpenDashboard={() => setCurrentView('dashboard')}
          onSellerChange={setSeller}
        />
        <Benefits currentLang={currentLang} />
        <HowItWorks currentLang={currentLang} />
        <SellerStory currentLang={currentLang} />
        <Programs currentLang={currentLang} />
        <SupportHub currentLang={currentLang} />
        <Faq currentLang={currentLang} />
        <CtaRibbon currentLang={currentLang} />
        <QuickMenuAndFab currentLang={currentLang} />
      </main>
      <Footer />
    </div>
  );
}
