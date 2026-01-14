'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme as antTheme, App } from 'antd';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        if (savedTheme) {
            setMode(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setMode('dark');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('theme', mode);
            document.documentElement.setAttribute('data-theme', mode);
        }
    }, [mode, mounted]);

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
    };

    const themeConfig = mode === 'dark' ? darkTheme : lightTheme;

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
            <ConfigProvider
                theme={{
                    algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                    token: themeConfig,
                    components: {
                        Layout: {
                            headerBg: mode === 'dark' ? '#1d2125' : '#ffffff',
                            siderBg: mode === 'dark' ? '#1d2125' : '#ffffff',
                            bodyBg: mode === 'dark' ? '#161a1d' : '#f4f5f7',
                        },
                        Menu: {
                            itemBg: 'transparent',
                        },
                        Card: {
                            boxShadow: mode === 'dark'
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
