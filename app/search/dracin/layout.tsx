import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'iQIYI Streaming - Nonton Drama & Film China Gratis | Inversave',
    description: 'Cari dan tonton drama China, film, dan serial di iQIYI. Temukan drama favorit, lihat cast, episode, dan streaming langsung gratis.',
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
    openGraph: {
        title: 'iQIYI Streaming - Nonton Drama & Film China Gratis | Inversave',
        description: 'Cari dan tonton drama China gratis di iQIYI. Temukan drama, lihat cast & episode.',
        url: 'https://inversave.space/search/dracin',
    },
};

export default function DracinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
