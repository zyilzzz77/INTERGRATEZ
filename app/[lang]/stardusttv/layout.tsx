import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Nonton StardustTV Gratis & Streaming Drama China Sub Indo',
        description: 'Streaming dan nonton StardustTV gratis online tanpa aplikasi. Nonton ratusan episode mini drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
        url: `/${lang}/stardusttv`,
        image: '/logo-stardusttv.png',
        keywords: [
            'nonton stardusttv',
            'streaming stardusttv',
            'stardusttv online',
            'stardusttv gratis',
            'drama china online',
            'nonton stardusttv gratis tanpa aplikasi',
            'streaming drama china gratis online',
            'stardusttv subtitle indonesia gratis',
            'nonton drama china gratis online',
            'stardusttv web streaming gratis',
            'stardust tv online sub indo',
            'nonton stardusttv di browser gratis'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function StardustTVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
