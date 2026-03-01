'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setTheme: (mode: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

const brand: MantineColorsTuple = [
    '#e6f0ff',
    '#cce0ff',
    '#99c2ff',
    '#66a3ff',
    '#3385ff',
    '#0052cc',
    '#0047b3',
    '#003d99',
    '#003380',
    '#002966',
];

const mantineTheme = createTheme({
    primaryColor: 'brand',
    colors: {
        brand,
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    defaultRadius: 'sm',
});

import { ModalsProvider } from '@mantine/modals';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreference] = useState<ThemePreference>('system');
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
    const [mounted, setMounted] = useState(false);

    const resolvedTheme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemePreference;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setPreference(savedTheme);
        }
        setSystemTheme(getSystemTheme());
        setMounted(true);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('theme', preference);
            document.documentElement.setAttribute('data-theme', resolvedTheme);
        }
    }, [preference, resolvedTheme, mounted]);

    const setThemeHandler = (newMode: ThemePreference) => {
        setPreference(newMode);
    };

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme: setThemeHandler }}>
            <MantineProvider theme={mantineTheme} forceColorScheme={resolvedTheme}>
                <ModalsProvider>
                    <Notifications position="top-right" />
                    {children}
                </ModalsProvider>
            </MantineProvider>
        </ThemeContext.Provider>
    );
};
