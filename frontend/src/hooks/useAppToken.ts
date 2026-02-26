import { theme } from 'antd';

/**
 * Custom semantic colors that extend Ant Design's token system.
 * These colors are NOT available in Ant Design's default tokens.
 * 
 * For standard colors, use Ant Design tokens directly:
 * - token.colorPrimary (#0052cc / #579dff)
 * - token.colorSuccess (#52c41a)
 * - token.colorError (#ff4d4f)
 * - token.colorWarning (#faad14)
 * - token.colorWhite (#fff)
 * - token.colorTextTertiary (#8c8c8c)
 * - token.colorErrorActive (#cf1322)
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
    colorTemplateCover: '#0079bf',
    colorTemplateBg: '#f4f5f7',
    colorTemplateDarkText: '#172b4d',
} as const;

export type CustomColors = typeof customColors;

export function useAppToken() {
    const { token } = theme.useToken();
    return { ...token, ...customColors };
}
