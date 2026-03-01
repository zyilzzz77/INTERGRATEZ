export const i18n = {
    defaultLocale: 'id',
    locales: ['en', 'id'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
