import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Download TikTok Tanpa Watermark Gratis',
        description: 'Cara download video TikTok tanpa watermark HD gratis tanpa aplikasi. Unduh video TikTok mp4 kualitas tinggi online tanpa login dan simpan langsung ke galeri.',
        url: `/${lang}/search/tiktok`,
        keywords: [
            'download tiktok',
            'unduh video tiktok',
            'tiktok downloader',
            'save tiktok video',
            'tiktok tanpa watermark',
            'cara download video tiktok tanpa watermark'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function TiktokLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
