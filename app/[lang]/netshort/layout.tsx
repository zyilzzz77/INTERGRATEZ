import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nonton Netshort Drama China Gratis & Streaming Sub Indo | Inversave',
    description: 'Streaming dan nonton Netshort Drama pendek China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
    keywords: [
        'nonton netshort drama',
        'streaming drama china pendek',
        'netshort drama gratis',
        'drama china online',
        'nonton drama china pendek gratis tanpa aplikasi',
        'streaming drama china gratis online',
        'drama china subtitle indonesia gratis',
        'netshort web streaming gratis',
        'drama china sub indo',
        'nonton netshort di browser gratis'
    ],
    openGraph: {
        title: 'Nonton Netshort Drama China Gratis & Streaming Sub Indo | Inversave',
        description: 'Streaming dan nonton Netshort Drama pendek China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru.',
        url: 'https://inversave.space/netshort',
    },
};

export default function NetshortLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
