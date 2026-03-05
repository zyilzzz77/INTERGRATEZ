import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Nonton Netshort Drama China Gratis & Streaming Sub Indo',
        description: 'Streaming dan nonton Netshort Drama pendek China gratis online tanpa aplikasi. Nonton ratusan episode drama China Sub Indo HD terbaru 2025. Tanpa download dan buffering.',
        url: `/${lang}/netshort`,
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
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function NetshortLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
