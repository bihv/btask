import { useMantineTheme, useMantineColorScheme } from '@mantine/core';

/**
 * Custom semantic colors that extend Mantine's theme system.
 */
const customColors = {
    // Semantic status colors
    colorStarYellow: '#f5cd47',
    colorOverdue: '#eb5a46',
    colorDueSoon: '#f2d600',
    colorDueComplete: '#5ba4cf',

    // Muted text variants
    colorMutedText: '#5e6c84',
    colorMutedTextLight: '#999',
    colorDefaultGray: '#666',

    // Surface overlays
    colorOverlayLight: 'rgba(255, 255, 255, 0.85)',
    colorOverlayDark: 'rgba(0, 0, 0, 0.3)',
    colorOverlayDarker: 'rgba(0, 0, 0, 0.6)',

    // Shadow presets
    colorShadowLight: 'rgba(0, 0, 0, 0.1)',
    colorShadowMedium: 'rgba(0, 0, 0, 0.15)',
    colorShadowHeavy: 'rgba(0, 0, 0, 0.2)',

    // Template fallback colors
    colorTemplateCover: '#206A5D',
    colorTemplateBg: '#f4f5f7',
    colorTemplateDarkText: '#172b4d',
} as const;

export type CustomColors = typeof customColors;

export function useAppToken() {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    return {
        // Map Ant Design token names to Mantine theme values for compatibility
        colorPrimary: theme.colors.brand[5],
        colorSuccess: theme.colors.green[6],
        colorError: theme.colors.red[6],
        colorWarning: theme.colors.yellow[6],
        colorWhite: '#fff',
        colorTextTertiary: theme.colors.gray[5],
        colorErrorActive: theme.colors.red[8],
        colorBgContainer: 'var(--bg-secondary)',
        colorBgLayout: 'var(--bg-primary)',
        colorText: 'var(--text-primary)',
        colorTextSecondary: 'var(--text-secondary)',
        colorBorder: 'var(--border-color)',
        borderRadius: 8,
        ...customColors,
        // Theme-aware overrides
        colorOverlayLight: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.85)',
        colorTemplateDarkText: isDark ? '#E2E8F0' : '#172b4d',
        colorTemplateBg: isDark ? '#171717' : '#f4f5f7',
        colorMutedText: isDark ? '#A3A3A3' : '#5e6c84',
    };
}
