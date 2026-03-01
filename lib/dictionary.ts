export type Dictionary = {
    [key: string]: any;
};

const dictionaries: Record<string, () => Promise<Dictionary>> = {
    en: () => import('@/dictionaries/en.json').then((module) => module.default),
    id: () => import('@/dictionaries/id.json').then((module) => module.default),
};

export const getDictionary = async (locale: string): Promise<Dictionary> => {
    // Fallback to 'id' if locale not supported
    if (!dictionaries[locale]) {
        return dictionaries['id']();
    }
    return dictionaries[locale]();
};
