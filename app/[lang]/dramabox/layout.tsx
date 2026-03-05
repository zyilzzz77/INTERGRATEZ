import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Nonton DramaBox Gratis & Streaming Drama China Sub Indo',
        description: 'Streaming dan nonton DramaBox gratis online tanpa aplikasi. Nonton ratusan episode mini drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
        url: `/${lang}/dramabox`,
        image: '/logo-dramabox.png',
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
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function DramaboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
