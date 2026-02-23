import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FreeReels — Nonton Drama Gratis Sub Indo HD | Inversave',
    description: 'Streaming dan nonton drama gratis online tanpa aplikasi. Ratusan episode mini drama populer Sub Indo HD terbaru 2025. Tanpa download, tanpa buffering.',
    keywords: [
        'nonton freereels',
        'streaming drama gratis',
        'freereels online',
        'drama gratis sub indo',
        'nonton drama china gratis',
        'mini drama online',
        'streaming gratis tanpa aplikasi',
        'freereels sub indonesia',
        'drama korea online gratis',
        'nonton drama web gratis'
    ],
    openGraph: {
        title: 'FreeReels — Nonton Drama Gratis Sub Indo HD | Inversave',
        description: 'Streaming dan nonton drama gratis online tanpa aplikasi. Ratusan episode mini drama populer Sub Indo HD terbaru 2025.',
        url: 'https://inversave.space/freereels',
    },
};

export default function FreeReelsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
