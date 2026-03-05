import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Top Up Kredit - Inversave',
        description: 'Top up kredit Inversave untuk menikmati download cepat dan streaming tanpa batas. Pilih paket yang sesuai kebutuhanmu.',
        url: `/${lang}/topup`,
        locale: lang === 'id' ? 'id_ID' : 'en_US',
    });
}

export default function TopupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section>{children}</section>;
}
