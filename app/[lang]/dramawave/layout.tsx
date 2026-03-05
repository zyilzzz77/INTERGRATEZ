import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Nonton DramaWave Gratis & Streaming Drama China Sub Indo',
        description: 'Streaming dan nonton DramaWave gratis online tanpa aplikasi. Nonton ratusan episode mini drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
        url: `/${lang}/dramawave`,
        image: '/logo-dramawave.png',
        keywords: [
            'nonton dramawave',
            'streaming dramawave',
            'dramawave online',
            'dramawave gratis',
            'drama china online',
            'nonton dramawave gratis tanpa aplikasi',
            'streaming drama china gratis online',
            'dramawave subtitle indonesia gratis',
            'nonton drama china gratis online',
            'dramawave web streaming gratis',
            'dramawave online sub indo',
            'nonton dramawave di browser gratis'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function DramawaveLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
