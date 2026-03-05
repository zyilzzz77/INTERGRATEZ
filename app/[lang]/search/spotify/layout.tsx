import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Download Lagu Spotify to MP3 Gratis Offline',
        description: 'Spotify downloader online tanpa aplikasi. Cara download lagu dan playlist Spotify offline gratis tanpa akun premium. Convert Spotify ke MP3 gratis 2025.',
        url: `/${lang}/search/spotify`,
        keywords: [
            'download spotify',
            'unduh lagu spotify',
            'spotify downloader',
            'spotify to mp3',
            'download musik spotify',
            'cara download lagu spotify gratis'
        ],
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default function SpotifyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
