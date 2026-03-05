import HeroSection from "@/components/HeroSection";
import PlatformCarousel from "@/components/PlatformCarousel";
import { getAllPlatforms } from "@/lib/platformDetector";
import { getDictionary } from "@/lib/dictionary";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return constructMetadata({
    url: `/${lang}`,
    locale: lang === 'id' ? 'id_ID' : 'en_US'
  });
}

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
