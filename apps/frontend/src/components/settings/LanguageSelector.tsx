import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export const LanguageSelector: React.FC = () => {
    const { currentLanguage, changeLanguage, availableLanguages, isRTL } = useTranslation();

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🌍 Language / اللغة / Sprache / Langue
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableLanguages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${currentLanguage === lang.code
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                        <div className="font-semibold">{lang.nativeName}</div>
                        <div className="text-sm text-gray-600">{lang.name}</div>
                    </button>
                ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                    {isRTL ? '✨ التطبيق يدعم الآن الوضع من اليمين إلى اليسار' : '✨ App now supports Right-to-Left layout'}
                </p>
            </div>
        </div>
    );
};
