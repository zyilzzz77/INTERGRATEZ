import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'iQIYI Streaming - Nonton Drama & Film China Gratis',
        description: 'Cari dan tonton drama China, film, dan serial di iQIYI. Temukan drama favorit, lihat cast, episode, dan streaming langsung gratis.',
        url: `/${lang}/search/dracin`,
        keywords: [
            'nonton drama china gratis',
            'streaming iqiyi gratis',
            'drama china sub indo',
            'nonton film china online',
            'iqiyi drama terbaru',
            'drama china streaming',
            'dracin sub indo',
            'serial china online'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function DracinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
