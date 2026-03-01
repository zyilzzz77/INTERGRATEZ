import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Download TikTok Tanpa Watermark Gratis | Inversave',
    description: 'Cara download video TikTok tanpa watermark HD gratis tanpa aplikasi. Unduh video TikTok mp4 kualitas tinggi online tanpa login dan simpan langsung ke galeri.',
    keywords: [
        'download tiktok',
        'unduh video tiktok',
        'tiktok downloader',
        'save tiktok video',
        'tiktok tanpa watermark',
        'cara download video tiktok tanpa watermark'
    ],
    openGraph: {
        title: 'Download TikTok Tanpa Watermark Gratis | Inversave',
        description: 'Unduh video TikTok HD gratis tanpa watermark online.',
        url: 'https://inversave.space/search/tiktok',
    },
};

export default function TiktokLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
