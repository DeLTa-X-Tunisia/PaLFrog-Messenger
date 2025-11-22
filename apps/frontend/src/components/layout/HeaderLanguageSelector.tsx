import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export const HeaderLanguageSelector: React.FC = () => {
    const { currentLanguage, changeLanguage, availableLanguages } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Change language"
            >
                <span className="text-xl">🌍</span>
                <span className="text-sm font-medium text-gray-700 uppercase hidden sm:inline-block">
                    {currentLanguage}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {availableLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                changeLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${currentLanguage === lang.code ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
                                }`}
                        >
                            <span>{lang.nativeName}</span>
                            {currentLanguage === lang.code && <span>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
