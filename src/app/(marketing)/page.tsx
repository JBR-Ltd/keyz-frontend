import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/Searchbar";
import HowItWorks from "@/components/HowItworks";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <SearchBar />
      <HowItWorks />
    </main>
  );
}
