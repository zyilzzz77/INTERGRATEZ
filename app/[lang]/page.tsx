import HeroSection from "@/components/HeroSection";
import PlatformCarousel from "@/components/PlatformCarousel";
import { getAllPlatforms } from "@/lib/platformDetector";
import { getDictionary } from "@/lib/dictionary";

const platforms = getAllPlatforms();

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="pb-20">
      {/* ─── Hero (Client Component) ─── */}
      <HeroSection dict={dict.home} />

      {/* ─── Supported Platforms (Client-rendered with Embla) ─── */}
      <PlatformCarousel />
    </div>
  );
}
