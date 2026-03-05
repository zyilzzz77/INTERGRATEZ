import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Instagram Downloader: Unduh Reels & Video Gratis',
        description: 'Download video Instagram, Reels, Story, dan foto gratis tanpa login. Unduh Reels IG HD dan simpan video Instagram carousel semua dengan mudah.',
        url: `/${lang}/search/instagram`,
        keywords: [
            'download instagram',
            'unduh video instagram',
            'instagram downloader',
            'download reels instagram',
            'save foto instagram',
            'download story ig orang',
            'cara download video instagram tanpa aplikasi'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function InstagramLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
