import DocsContent from "@/components/DocsContent";
import { getDictionary } from "@/lib/dictionary";
import { constructMetadata } from "@/lib/seo";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.docs.title} - Inversave`,
        description: dict.docs.subtitle,
        url: `/${lang}/docs`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function DocsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <DocsContent dict={dict} lang={lang} />;
}
