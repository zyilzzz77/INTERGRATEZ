import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Riwayat Top Up - Inversave',
        description: 'Lihat riwayat pembelian dan transaksi kredit Inversave kamu di sini.',
        url: `/${lang}/topup/history`,
        locale: lang === 'id' ? 'id_ID' : 'en_US',
        noIndex: true // Transaction history shouldn't be indexed
    });
}

export default function TopupHistoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
