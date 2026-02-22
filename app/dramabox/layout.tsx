import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nonton DramaBox Gratis & Streaming Drama China Sub Indo | Inversave',
    description: 'Streaming dan nonton DramaBox gratis online tanpa aplikasi. Nonton ratusan episode mini drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
    keywords: [
        'nonton dramabox',
        'streaming dramabox',
        'dramabox online',
        'dramabox gratis',
        'drama korea online',
        'nonton dramabox gratis tanpa aplikasi',
        'streaming drama korea gratis online',
        'dramabox subtitle indonesia gratis',
        'nonton drama china gratis online',
        'dramabox web streaming gratis',
        'drama box online sub indo',
        'nonton dramabox di browser gratis'
    ],
    openGraph: {
        title: 'Nonton DramaBox Gratis & Streaming Drama China Sub Indo | Inversave',
        description: 'Streaming dan nonton DramaBox gratis online tanpa aplikasi. Nonton ratusan episode mini drama China Sub Indo HD terbaru 2025.',
        url: 'https://inversave.space/dramabox',
        images: [
            {
                url: '/logo-dramabox.png',
                width: 800,
                height: 800,
                alt: 'DramaBox Streaming',
            },
        ],
    },
};

export default function DramaboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
