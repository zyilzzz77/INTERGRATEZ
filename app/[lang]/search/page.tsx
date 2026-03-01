import SearchPageClient from "./page.client";

export default async function SearchPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const { getDictionary } = await import("@/lib/dictionary");
    const dict = await getDictionary(lang);

    return <SearchPageClient dict={dict} lang={lang} />;
}
