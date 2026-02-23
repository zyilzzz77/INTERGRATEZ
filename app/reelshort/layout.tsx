import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ReelShort — Nonton Drama Pendek Gratis Sub Indo HD | Inversave",
    description:
        "Tonton drama pendek viral dari ReelShort gratis dengan subtitle Indonesia. Streaming HD tanpa iklan, langsung dari browser.",
    keywords: [
        "reelshort",
        "drama pendek",
        "nonton drama gratis",
        "subtitle indonesia",
        "streaming HD",
        "drama viral",
    ],
    openGraph: {
        title: "ReelShort — Drama Pendek Gratis Sub Indo",
        description: "Stream drama pendek viral ReelShort gratis di Inversave",
        type: "website",
    },
};

export default function ReelShortLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
