import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { isRTL } from '../i18n';

export const useTranslation = () => {
    const { t, i18n } = useI18nTranslation();

    const changeLanguage = useCallback((lng: string) => {
        i18n.changeLanguage(lng);

        // Mettre à jour la direction du document
        document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;

        // Sauvegarder la préférence
        localStorage.setItem('palfrog-language', lng);
    }, [i18n]);

    const currentLanguage = i18n.language?.split('-')[0];
    const direction = isRTL(currentLanguage) ? 'rtl' : 'ltr';

    return {
        t,
        changeLanguage,
        currentLanguage,
        direction,
        isRTL: direction === 'rtl',
        availableLanguages: [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano' },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
            { code: 'fa', name: 'Persian', nativeName: 'فارسی' }
        ]
    };
};
