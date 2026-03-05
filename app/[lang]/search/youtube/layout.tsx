import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Download Video YouTube & MP3 Gratis',
        description: 'Unduh video YouTube HD 1080p dan convert YouTube to MP3 320kbps online gratis tanpa software. Download playlist dan YouTube Shorts dengan mudah.',
        url: `/${lang}/search/youtube`,
        keywords: [
            'download youtube',
            'unduh video youtube',
            'youtube downloader',
            'download video yt',
            'youtube to mp4',
            'cara download video youtube gratis'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function YoutubeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
