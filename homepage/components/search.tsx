'use client';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, MessageCircleIcon, RefreshCw, Send, X, User } from 'lucide-react';
import { cn } from '../lib/cn';
import { buttonVariants } from './ui/button';
import Link from 'fumadocs-core/link';
import { type UIMessage, useChat, type UseChatHelpers } from '@ai-sdk/react';
import type { ProvideLinksToolSchema } from '../lib/inkeep-qa-schema';
import type { z } from 'zod';
import { DefaultChatTransport } from 'ai';
import { Markdown } from './markdown';
import { Presence } from '@radix-ui/react-presence';

// Helper to normalize doc URLs - convert absolute URLs to relative paths
function normalizeDocsUrl(url: string): string {
  if (!url) return '/docs';

  // If already a relative path, return as-is
  if (url.startsWith('/')) return url;

  // Try to extract path from absolute URL
  try {
    const parsed = new URL(url);
    // Return just the pathname
    return parsed.pathname || '/docs';
  } catch {
    // If URL parsing fails, try to extract /docs/ path
    const docsMatch = url.match(/\/docs\/[^\s]*/);
    if (docsMatch) return docsMatch[0];

    // Fallback: prepend /docs/ if it looks like a slug
    if (!url.includes('://') && !url.startsWith('/')) {
      return `/docs/${url}`;
    }

    return '/docs';
  }
}

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
} | null>(null);

function useChatContext() {
  return use(Context)!.chat;
}

function Header() {
  const { setOpen } = use(Context)!;

  return (
    <div className="sticky top-0 z-10">
      <div className="p-3 border rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-fd-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Mello" className="w-5 h-5" />
            <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mello AI Assistant
            </p>
          </div>
          <button
            aria-label="Close"
            tabIndex={-1}
            className={cn(
              buttonVariants({
                size: 'icon-sm',
                color: 'ghost',
                className: 'rounded-full hover:bg-fd-muted',
              }),
            )}
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-fd-muted-foreground mt-1">Ask anything about Mello documentation</p>
      </div>
    </div>
  );
}

// Suggested questions for empty state
const suggestedQuestions = [
  'How do I get started with Mello?',
  'How to deploy Mello with Docker?',
  'How can I contribute to the project?',
];

function EmptyState() {
  const { sendMessage } = useChatContext();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
        <img src="/favicon.svg" alt="Mello" className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Welcome to Mello AI</h3>
      <p className="text-sm text-fd-muted-foreground mb-4">Ask me anything about Mello documentation</p>

      <div className="w-full space-y-2">
        <p className="text-xs text-fd-muted-foreground uppercase tracking-wide">Suggested questions</p>
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage({ parts: [{ type: 'text', text: q }] })}
            className="w-full text-left text-sm p-3 rounded-lg border border-fd-border hover:bg-fd-accent hover:border-fd-primary/30 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchAIActions() {
  const { messages, status, setMessages, regenerate } = useChatContext();
  const isLoading = status === 'streaming';

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === 'assistant' && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              size: 'sm',
              className: 'rounded-full gap-1.5',
            }),
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'rounded-full',
          }),
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </button>
    </>
  );
}

const StorageKeyInput = '__ai_search_input';
function SearchAIInput(props: ComponentProps<'form'>) {
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState(() => localStorage.getItem(StorageKeyInput) ?? '');
  const isLoading = status === 'streaming' || status === 'submitted';
  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault();
    void sendMessage({ text: input });
    setInput('');
  };

  localStorage.setItem(StorageKeyInput, input);

  useEffect(() => {
    if (isLoading) document.getElementById('nd-ai-input')?.focus();
  }, [isLoading]);

  return (
    <form {...props} className={cn('flex items-center gap-2 pe-2', props.className)} onSubmit={onStart}>
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask anything about Mello...'}
        autoFocus
        className="p-3 bg-transparent"
        disabled={status === 'streaming' || status === 'submitted'}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter') {
            onStart(event);
          }
        }}
      />
      {isLoading ? (
        <button
          key="bn"
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              className: 'transition-all rounded-full mt-2 gap-2',
            }),
          )}
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
          Abort Answer
        </button>
      ) : (
        <button
          key="bn"
          type="submit"
          className={cn(
            'p-2 rounded-full transition-all',
            input.length > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90'
              : 'bg-fd-muted text-fd-muted-foreground'
          )}
          disabled={input.length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function List(props: Omit<ComponentProps<'div'>, 'dir'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn('fd-scroll-container overflow-y-auto min-w-0 flex flex-col', props.className)}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn('col-start-1 row-start-1', props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          'resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none',
          shared,
        )}
      />
      <div ref={ref} className={cn(shared, 'break-all invisible')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  );
}

const roleName: Record<string, string> = {
  user: 'you',
  assistant: 'Mello AI',
};

function Message({ message, ...props }: { message: UIMessage } & ComponentProps<'div'>) {
  let markdown = '';
  let links: z.infer<typeof ProvideLinksToolSchema>['links'] = [];

  for (const part of message.parts ?? []) {
    if (part.type === 'text') {
      markdown += part.text;
      continue;
    }

    // Handle tool-provideLinks format (Inkeep style)
    if (part.type === 'tool-provideLinks' && part.input) {
      links = (part.input as z.infer<typeof ProvideLinksToolSchema>).links;
    }

    // Handle tool-invocation format (AI SDK style)
    if (part.type === 'tool-invocation') {
      const toolPart = part as any;
      if (toolPart.toolName === 'provideLinks') {
        // Check for result first (when tool execution is complete)
        if (toolPart.result?.links) {
          links = toolPart.result.links;
        } else if (toolPart.output?.links) {
          links = toolPart.output.links;
        } else if (toolPart.args?.links) {
          links = toolPart.args.links;
        } else if (toolPart.input?.links) {
          links = toolPart.input.links;
        }
      }
    }
  }

  // Normalize URLs to ensure they are relative paths
  if (links && links.length > 0) {
    links = links.map(link => ({
      ...link,
      url: normalizeDocsUrl(link.url),
    }));
  }

  const isUser = message.role === 'user';

  return (
    <div {...props} className={cn('group', props.className)}>
      <div className={cn(
        'flex flex-col gap-2',
        isUser && 'items-end'
      )}>
        {/* Row 1: Avatar + Role name */}
        <div className={cn(
          'flex items-center gap-2',
          isUser && 'flex-row-reverse'
        )}>
          <div className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            isUser
              ? 'bg-fd-primary text-fd-primary-foreground'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          )}>
            {isUser ? (
              <User className="w-3.5 h-3.5" />
            ) : (
              <img src="/favicon.svg" alt="Mello" className="w-3.5 h-3.5" />
            )}
          </div>
          <p className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            isUser
              ? 'text-fd-muted-foreground'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600',
          )}>
            {roleName[message.role] ?? 'unknown'}
          </p>
        </div>

        {/* Row 2: Message content - full width */}
        <div className={cn(
          'w-full',
          isUser && 'flex justify-end'
        )}>
          <div className={cn(
            'prose prose-sm max-w-none text-fd-foreground rounded-2xl px-4 py-3',
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white prose-invert rounded-tr-sm inline-block max-w-[90%]'
              : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-fd-border rounded-tl-sm'
          )}>
            {isUser ? (
              <p>{markdown}</p>
            ) : (
              <Markdown text={markdown} />
            )}
          </div>
        </div>

        {/* Reference links - only for AI */}
        {!isUser && links && links.length > 0 && (
          <div className="mt-4 pt-3 border-t border-fd-border/50 w-full">
            <p className="text-xs font-medium text-fd-muted-foreground mb-2 flex items-center gap-1.5">
              <span>📚</span> References
            </p>
            <div className="flex flex-row flex-wrap gap-2">
              {links.map((item, i) => (
                <Link
                  key={i}
                  href={item.url}
                  className={cn(
                    'group/link relative block text-xs rounded-xl border border-fd-border/50 p-3',
                    'bg-gradient-to-br from-fd-card to-fd-background',
                    'hover:border-fd-primary/50 hover:shadow-md hover:shadow-fd-primary/5',
                    'transition-all duration-200 ease-out',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fd-primary/10 text-fd-primary flex items-center justify-center text-[10px] font-bold">
                      {item.label}
                    </span>
                    <div>
                      <p className="font-medium text-fd-foreground group-hover/link:text-fd-primary transition-colors">
                        {item.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const chat = useChat({
    id: 'search',
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>{children}</Context>
  );
}

export function AISearchTrigger() {
  const { open, setOpen } = use(Context)!;

  return (
    <button
      className={cn(
        buttonVariants({
          variant: 'secondary',
        }),
        'fixed bottom-4 gap-2 end-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] text-fd-muted-foreground rounded-2xl shadow-lg z-20 transition-[translate,opacity]',
        open && 'translate-y-10 opacity-0',
      )}
      onClick={() => setOpen(true)}
    >
      <MessageCircleIcon className="size-4.5" />
      <span>Ask AI</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-fd-muted rounded border border-fd-border">
        <span className="text-xs">⌘</span>/
      </kbd>
    </button>
  );
}

export function AISearchPanel() {
  const { open, setOpen } = use(Context)!;
  const chat = useChatContext();

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, []);

  return (
    <>
      <style>
        {`
        @keyframes ask-ai-open {
          from {
            width: 0px;
          }
          to {
            width: var(--ai-chat-width);
          }
        }
        @keyframes ask-ai-close {
          from {
            width: var(--ai-chat-width);
          }
          to {
            width: 0px;
          }
        }`}
      </style>
      <Presence present={open}>
        <div
          data-state={open ? 'open' : 'closed'}
          className="fixed inset-0 z-30 backdrop-blur-xs bg-fd-overlay data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out lg:hidden"
          onClick={() => setOpen(false)}
        />
      </Presence>
      <Presence present={open}>
        <div
          className={cn(
            'overflow-hidden z-30 bg-fd-popover text-fd-popover-foreground [--ai-chat-width:400px] xl:[--ai-chat-width:460px]',
            'max-lg:fixed max-lg:inset-x-2 max-lg:top-4 max-lg:border max-lg:rounded-2xl max-lg:shadow-xl',
            'lg:sticky lg:top-0 lg:h-dvh lg:border-s  lg:ms-auto lg:in-[#nd-docs-layout]:[grid-area:toc] lg:in-[#nd-notebook-layout]:row-span-full lg:in-[#nd-notebook-layout]:col-start-5',
            open
              ? 'animate-fd-dialog-in lg:animate-[ask-ai-open_200ms]'
              : 'animate-fd-dialog-out lg:animate-[ask-ai-close_200ms]',
          )}
        >
          <div className="flex flex-col p-2 size-full max-lg:max-h-[80dvh] lg:w-(--ai-chat-width) xl:p-4">
            <Header />
            <List
              className="px-3 py-4 flex-1 overscroll-contain"
              style={{
                maskImage:
                  'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
              }}
            >
              <div className="flex flex-col gap-4">
                {/* Empty state */}
                {chat.messages.filter((msg) => msg.role !== 'system').length === 0 && chat.status === 'ready' && (
                  <EmptyState />
                )}

                {/* Error state */}
                {chat.status === 'error' && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="font-medium text-sm">Something went wrong</p>
                      <p className="text-xs opacity-80">Please try again or check your connection</p>
                    </div>
                  </div>
                )}

                {chat.messages
                  .filter((msg) => msg.role !== 'system')
                  .map((item) => (
                    <Message key={item.id} message={item} />
                  ))}
                {/* Typing indicator */}
                {(chat.status === 'submitted' || (chat.status === 'streaming' && chat.messages.length === 0)) && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <img src="/favicon.svg" alt="Mello" className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-fd-card border border-fd-border">
                      <span className="w-2 h-2 bg-fd-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-fd-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-fd-muted-foreground rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </List>
            <div className="rounded-xl border border-fd-border bg-gradient-to-r from-blue-500/5 to-purple-500/5 has-focus-within:border-fd-primary/50 has-focus-within:ring-1 has-focus-within:ring-fd-primary/20 transition-all">
              <SearchAIInput />
              <div className="flex items-center gap-1.5 px-2 pb-2 empty:hidden">
                <SearchAIActions />
              </div>
            </div>
          </div>
        </div>
      </Presence>
    </>
  );
}
