import YouTubeWatchClient from "./page.client";

export default async function YouTubeWatchPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const { getDictionary } = await import('@/lib/dictionary');
    const dict = await getDictionary(lang);
    return <YouTubeWatchClient dict={dict.youtube} lang={lang} />;
}
