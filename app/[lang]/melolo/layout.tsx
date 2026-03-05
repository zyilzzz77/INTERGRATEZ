import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Nonton Melolo Drama China Gratis & Streaming Sub Indo',
        description: 'Streaming dan nonton Melolo Drama China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
        url: `/${lang}/melolo`,
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
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function MeloloLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
