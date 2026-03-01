import DocsContent from "@/components/DocsContent";
import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: `${dict.docs.title} - Inversave`,
        description: dict.docs.subtitle,
    };
}

export default async function DocsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return <DocsContent dict={dict} lang={lang} />;
}
