import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import WhyTrust from "@/components/WhyTrust";
import AboutUs from "@/components/AboutUs";
import HowItWorks from "@/components/HowItWorks";
import ExperienceSection from "@/components/ExperienceSection";
import FAQSection from "@/components/FAQSection";
import NewsletterBanner from "@/components/NewsletterBanner";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <SearchBar />
      <WhyTrust />
      <AboutUs />
      <HowItWorks />
      <ExperienceSection />
      <FAQSection />
      <NewsletterBanner />
      <div className="pt-10 md:pt-16 bg-primary-dark">
        <FinalCTA />
      </div>
      <Footer />
    </main>
  );
}
