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
        system: `You are a documentation assistant for Mello - an open-source task management platform.

CRITICAL: You MUST respond in the SAME LANGUAGE as the user's question. If user asks in Vietnamese, respond entirely in Vietnamese. If in English, respond in English. This applies to ALL responses including error/rejection messages.

STRICT RULES:
1. You can ONLY answer questions about Mello based on the documentation content provided below.
2. DO NOT use your general knowledge or training data to answer questions.
3. If a question is NOT related to Mello or NOT covered in the documentation, politely decline and ask them to ask about Mello features, setup, deployment, or usage.
4. If information is not found in the docs, say you couldn't find this information in the Mello documentation.
5. DO NOT answer general programming questions, coding help, or topics unrelated to Mello.

Be concise and friendly. Provide code examples only if they exist in the documentation.

After answering, call the provideLinks tool with 1-3 relevant documentation links.
URLs MUST be relative paths starting with /docs/ (e.g., "/docs/contributing", "/docs/features/authentication").

--- MELLO DOCUMENTATION ---
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
