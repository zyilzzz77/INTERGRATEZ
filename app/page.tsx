import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import { getAllPlatforms } from "@/lib/platformDetector";

const platforms = getAllPlatforms();

export default function HomePage() {
  return (
    <div className="pb-20">
      {/* ─── Hero (Client Component) ─── */}
      <HeroSection />

      {/* ─── Supported Platforms (Server-rendered) ─── */}
      <section className="mx-auto mt-16 max-w-4xl px-4">
        <h2 className="mb-6 text-center text-lg font-bold text-neutral-300">
          Platform yang Didukung
        </h2>
        <div className="group relative flex w-full overflow-hidden">
          <div className="animate-marquee flex min-w-full gap-4 py-4">
            {[...platforms, ...platforms].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex min-w-[100px] select-none flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10 sm:min-w-[120px]"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ring-1 ring-white/20"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon.startsWith("/") ? (
                    <Image
                      src={p.icon}
                      alt={p.label}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  ) : p.localIconSvg ? (
                    <Image
                      src={p.localIconSvg}
                      alt={p.label}
                      width={24}
                      height={24}
                      className="h-6 w-6"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white drop-shadow-md">
                      {p.icon}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-neutral-400">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
