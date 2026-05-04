import { HeroCarousel } from "./components/hero-carousel";
import { MarketingNavbar } from "./components/marketing-navbar";
import { HowItWorksSection } from "./components/how-it-works-section";
import { FeatureCardsSection } from "./components/feature-cards-section";
import { CtaBanner } from "./components/cta-banner";

export default function MarketingPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />
      <HeroCarousel />
      <HowItWorksSection />
      <FeatureCardsSection />
      <CtaBanner />
    </main>
  );
}
