import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages, streamText } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';

const openrouter = createOpenAICompatible({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

// Cache docs content to avoid fetching on every request
let docsCache: string | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getDocsContent(baseUrl: string): Promise<string> {
    const now = Date.now();
    if (docsCache && now - lastFetch < CACHE_TTL) {
        return docsCache;
    }

    try {
        const response = await fetch(`${baseUrl}/llms-full.txt`);
        if (!response.ok) {
            throw new Error(`Failed to fetch docs: ${response.status}`);
        }
        docsCache = await response.text();
        lastFetch = now;
        return docsCache;
    } catch (error) {
        console.error('Failed to load docs content:', error);
        return '';
    }
}

// Tool schema for providing documentation links
const provideLinksSchema = z.object({
    links: z.array(
        z.object({
            label: z.string().describe('Reference number, e.g. "1", "2"'),
            url: z.string().describe('URL to the documentation page'),
            title: z.string().describe('Title of the documentation page'),
        })
    ).describe('List of relevant documentation links to reference'),
});

export async function POST(req: Request) {
    const reqJson = await req.json();

    // Get base URL from request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const docsContent = await getDocsContent(baseUrl);

    const result = streamText({
        // You can use any model available on OpenRouter that supports function calling
        // Options: openai/gpt-4o-mini, anthropic/claude-3.5-sonnet, google/gemini-2.0-flash
        model: openrouter('mistralai/devstral-2512:free'),
        system: `You are a helpful AI assistant for Mello documentation.
Mello is an open-source task management platform inspired by Trello.

IMPORTANT: You MUST only answer based on the documentation content provided below. 
If the answer is not found in the documentation, say "I couldn't find information about this in the documentation."
Do NOT make up or hallucinate any information that is not in the docs.

Be concise, friendly, and provide code examples when relevant.

After answering, call the provideLinks tool with 1-3 relevant documentation links.
CRITICAL: URLs MUST be relative paths starting with /docs/ (e.g., "/docs/contributing", "/docs/features/authentication").
DO NOT use absolute URLs like "https://mello.com/docs/..." - only use relative paths like "/docs/...".

--- DOCUMENTATION CONTENT ---
${docsContent}
--- END DOCUMENTATION ---`,
        messages: await convertToModelMessages(reqJson.messages, {
            ignoreIncompleteToolCalls: true,
        }),
        tools: {
            provideLinks: {
                description: 'Provide relevant documentation links that support the answer. Call this after answering to show reference links.',
                inputSchema: provideLinksSchema,
                // Execute function returns the links - this is required for tool result to be properly structured
                execute: async (input) => {
                    return input;
                },
            },
        },
        toolChoice: 'auto',
    });

    return result.toUIMessageStreamResponse();
}
