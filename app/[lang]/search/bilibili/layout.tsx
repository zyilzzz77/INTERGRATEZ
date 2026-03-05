import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Download Video Bilibili & Anime HD Gratis',
        description: 'Mencari cara download video Bilibili tanpa aplikasi? Gunakan Bilibili downloader online gratis kami untuk unduh anime HD dengan subtitle Indonesia tanpa login.',
        url: `/${lang}/search/bilibili`,
        keywords: [
            'download bilibili',
            'unduh video bilibili',
            'bilibili downloader',
            'download anime bilibili',
            'bilibili video download',
            'cara download video bilibili tanpa aplikasi'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function BilibiliLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
