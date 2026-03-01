import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nonton Melolo Drama China Gratis & Streaming Sub Indo | Inversave',
    description: 'Streaming dan nonton Melolo Drama China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
    keywords: [
        'nonton melolo drama',
        'streaming drama china',
        'melolo drama gratis',
        'drama china online',
        'nonton drama china gratis tanpa aplikasi',
        'streaming drama china gratis online',
        'drama china subtitle indonesia gratis',
        'melolo web streaming gratis',
        'drama china sub indo',
        'nonton melolo di browser gratis'
    ],
    openGraph: {
        title: 'Nonton Melolo Drama China Gratis & Streaming Sub Indo | Inversave',
        description: 'Streaming dan nonton Melolo Drama China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru.',
        url: 'https://inversave.space/melolo',
    },
};

export default function MeloloLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
