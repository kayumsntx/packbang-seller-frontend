import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
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

  return (
    <div className="packbang-theme">
      <Header currentLang={currentLang} onLangChange={setCurrentLang} />
      <main>
        <Hero currentLang={currentLang} />
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
