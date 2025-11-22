import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('palfrog-theme') as Theme;
        return saved || 'auto';
    });

    useEffect(() => {
        const root = document.documentElement;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const effectiveTheme = theme === 'auto' ? systemTheme : theme;

        root.setAttribute('data-theme', effectiveTheme);
        root.classList.add('theme-transition');

        localStorage.setItem('palfrog-theme', theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'auto') {
                const root = document.documentElement;
                root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return { theme, setTheme };
};
