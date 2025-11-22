import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ar from './locales/ar.json';
import fa from './locales/fa.json';

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    it: { translation: it },
    ar: { translation: ar },
    fa: { translation: fa },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },

        react: {
            useSuspense: true,
        },
    });

// Direction des langues RTL
export const isRTL = (lng: string) => ['ar', 'fa'].includes(lng);

export default i18n;
