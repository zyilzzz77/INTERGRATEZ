import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Download Lagu Spotify to MP3 Gratis Offline | Inversave',
    description: 'Spotify downloader online tanpa aplikasi. Cara download lagu dan playlist Spotify offline gratis tanpa akun premium. Convert Spotify ke MP3 gratis 2025.',
    keywords: [
        'download spotify',
        'unduh lagu spotify',
        'spotify downloader',
        'spotify to mp3',
        'download musik spotify',
        'cara download lagu spotify gratis'
    ],
    openGraph: {
        title: 'Download Lagu Spotify to MP3 Gratis Offline | Inversave',
        description: 'Simpan lagu dan playlist Spotify menjadi file MP3 gratis.',
        url: 'https://inversave.space/search/spotify',
    },
};

export default function SpotifyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
