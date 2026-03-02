'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MantineProvider, createTheme, MantineColorsTuple, CSSVariablesResolver } from '@mantine/core';
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
    '#FFF7ED',
    '#FFEDD5',
    '#FED7AA',
    '#FDBA74',
    '#FB923C',
    '#F97316',
    '#EA580C',
    '#C2410C',
    '#9A3412',
    '#7C2D12',
];

const mantineTheme = createTheme({
    primaryColor: 'brand',
    colors: {
        brand,
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    defaultRadius: 'sm',
    other: {
        bgPrimary:     ['#FAFAFA', '#0A0A0A'],
        bgSecondary:   ['#FFFFFF', '#171717'],
        bgTertiary:    ['#F5F5F5', '#262626'],
        textPrimary:   ['#171717', '#FAFAFA'],
        textSecondary: ['#737373', '#A3A3A3'],
        borderColor:   ['#E5E5E5', '#262626'],
        primaryColor:  ['#F97316', '#FB923C'],
        primaryHover:  ['#EA580C', '#FDBA74'],
    },
});

const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
    variables: {},
    light: {
        '--bg-primary': theme.other.bgPrimary[0],
        '--bg-secondary': theme.other.bgSecondary[0],
        '--bg-tertiary': theme.other.bgTertiary[0],
        '--text-primary': theme.other.textPrimary[0],
        '--text-secondary': theme.other.textSecondary[0],
        '--border-color': theme.other.borderColor[0],
        '--primary-color': theme.other.primaryColor[0],
        '--primary-hover': theme.other.primaryHover[0],
    },
    dark: {
        '--bg-primary': theme.other.bgPrimary[1],
        '--bg-secondary': theme.other.bgSecondary[1],
        '--bg-tertiary': theme.other.bgTertiary[1],
        '--text-primary': theme.other.textPrimary[1],
        '--text-secondary': theme.other.textSecondary[1],
        '--border-color': theme.other.borderColor[1],
        '--primary-color': theme.other.primaryColor[1],
        '--primary-hover': theme.other.primaryHover[1],
    },
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
            <MantineProvider theme={mantineTheme} forceColorScheme={resolvedTheme} cssVariablesResolver={cssVariablesResolver}>
                <ModalsProvider>
                    <Notifications position="top-right" />
                    {children}
                </ModalsProvider>
            </MantineProvider>
        </ThemeContext.Provider>
    );
};
