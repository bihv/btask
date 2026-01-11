/**
 * Custom code block configuration with ALL Shiki bundled languages
 * This replaces the default codeBlockOptions from @blocknote/code-block
 */

import { bundledLanguages, createHighlighter as createShikiHighlighter } from 'shiki';

// Convert bundledLanguages to supportedLanguages format for BlockNote
const allLanguages: Record<string, { name: string; aliases?: string[] }> = {};

// Add all bundled languages from Shiki (sorted alphabetically)
Object.keys(bundledLanguages)
    .sort((a, b) => a.localeCompare(b))
    .forEach((lang) => {
        // Format the language name nicely
        const name = lang
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        allLanguages[lang] = { name };
    });

// Add some common aliases
const languageAliases: Record<string, string[]> = {
    'javascript': ['js'],
    'typescript': ['ts'],
    'python': ['py'],
    'markdown': ['md'],
    'yaml': ['yml'],
    'bash': ['sh', 'shell', 'zsh'],
    'json': ['jsonc'],
    'dockerfile': ['docker'],
    'csharp': ['cs', 'c#'],
    'cpp': ['c++'],
    'fsharp': ['fs', 'f#'],
    'html': ['htm'],
    'ruby': ['rb'],
    'rust': ['rs'],
    'kotlin': ['kt'],
    'swift': ['sw'],
    'lua': ['luau'],
    'perl': ['pl'],
    'r': ['R'],
    'scala': ['sc'],
};

// Apply aliases
Object.entries(languageAliases).forEach(([lang, aliases]) => {
    if (allLanguages[lang]) {
        allLanguages[lang].aliases = aliases;
    }
});

// Custom code block options with ALL languages
export const fullCodeBlockOptions = {
    indentLineWithTab: true,
    defaultLanguage: 'text',
    supportedLanguages: allLanguages,
    createHighlighter: () =>
        createShikiHighlighter({
            themes: ['github-dark', 'github-light'],
            langs: Object.keys(bundledLanguages),
        }),
};

// Export the count for verification
export const languageCount = Object.keys(allLanguages).length;
