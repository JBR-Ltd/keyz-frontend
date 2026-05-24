import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/Searchbar";
import HowItWorks from "@/components/HowItworks";
import KeyzAdvantage from "@/components/Keyzadvantage";
import DualCTA from "@/components/DualCTA";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <SearchBar />
      <HowItWorks />
      <KeyzAdvantage />
      <DualCTA />
      <Footer />
    </main>
  );
}