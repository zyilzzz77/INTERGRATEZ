import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import PlatformCarousel from "@/components/PlatformCarousel";
import { getAllPlatforms } from "@/lib/platformDetector";

const platforms = getAllPlatforms();

export default function HomePage() {
  return (
    <div className="pb-20">
      {/* ─── Hero (Client Component) ─── */}
      <HeroSection />

      {/* ─── Supported Platforms (Client-rendered with Embla) ─── */}
      <PlatformCarousel />
    </div>
  );
}
