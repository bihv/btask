'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antTheme, App } from 'antd';

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

const lightTheme = {
    colorPrimary: '#0052cc',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f4f5f7',
    colorBgElevated: '#ffffff',
    colorText: '#172b4d',
    colorTextSecondary: '#5e6c84',
    colorBorder: '#dfe1e6',
    borderRadius: 8,
};

const darkTheme = {
    colorPrimary: '#579dff',
    colorBgContainer: '#1d2125',
    colorBgLayout: '#161a1d',
    colorBgElevated: '#22272b',
    colorText: '#b6c2cf',
    colorTextSecondary: '#9fadbc',
    colorBorder: '#38414a',
    borderRadius: 8,
};

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreference] = useState<ThemePreference>('system');
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
    const [mounted, setMounted] = useState(false);

    // Resolve the actual theme based on preference
    const resolvedTheme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

    // Initialize on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemePreference;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setPreference(savedTheme);
        }
        setSystemTheme(getSystemTheme());
        setMounted(true);
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Persist preference and update document attribute
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('theme', preference);
            document.documentElement.setAttribute('data-theme', resolvedTheme);
        }
    }, [preference, resolvedTheme, mounted]);

    const setTheme = (newMode: ThemePreference) => {
        setPreference(newMode);
    };

    const themeConfig = resolvedTheme === 'dark' ? darkTheme : lightTheme;

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme }}>
            <ConfigProvider
                theme={{
                    algorithm: resolvedTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                    token: themeConfig,
                    components: {
                        Layout: {
                            headerBg: resolvedTheme === 'dark' ? '#1d2125' : '#ffffff',
                            siderBg: resolvedTheme === 'dark' ? '#1d2125' : '#ffffff',
                            bodyBg: resolvedTheme === 'dark' ? '#161a1d' : '#f4f5f7',
                        },
                        Menu: {
                            itemBg: 'transparent',
                        },
                        Card: {
                            boxShadow: resolvedTheme === 'dark'
                                ? '0 1px 1px rgba(0,0,0,0.25)'
                                : '0 1px 1px rgba(9,30,66,0.25)',
                        },
                    },
                }}
            >
                <App>
                    {children}
                </App>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
};
