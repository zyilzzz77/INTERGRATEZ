import YouTubeSearchClient from "./page.client";

export default async function YouTubeServerPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const { getDictionary } = await import('@/lib/dictionary');
    const dict = await getDictionary(lang);
    return <YouTubeSearchClient dict={dict.youtube} lang={lang} />;
}
