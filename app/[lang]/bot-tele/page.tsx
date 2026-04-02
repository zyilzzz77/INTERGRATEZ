import BotTeleMiniApp from "@/components/BotTeleMiniApp";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return constructMetadata({
    title: "Telegram Bot Mini App | Inversave",
    description: "Pantau status downloader dan jalankan mini apps Telegram Inversave dengan data pengguna yang dikirim dari bot.",
    url: `/${lang}/bot-tele`,
    locale: lang === "id" ? "id_ID" : "en_US",
  });
}

export default async function BotTelePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="relative isolate px-4 py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Bot Telegram</p>
          <h1 className="text-4xl font-black text-neutral-900 md:text-5xl">Mini Apps Downloader</h1>
          <p className="mt-2 max-w-3xl text-neutral-600">
            {lang === "id"
              ? "Halaman mini apps untuk bot Telegram Inversave. Pantau status downloader, lihat identitas pengguna yang dikirim dari Telegram, dan kirim link untuk diproses."
              : "Mini app page for the Inversave Telegram bot. Monitor downloader status, view user identity passed from Telegram, and send links to process."}
          </p>
        </div>

        <BotTeleMiniApp lang={lang} />
      </div>
    </div>
  );
}
