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
    <div className="sticky top-0 flex items-start gap-2">
      <div className="flex-1 p-3 border rounded-xl bg-fd-card text-fd-card-foreground">
        <p className="text-sm font-medium">Ask AI</p>
      </div>
      <button
        aria-label="Close"
        tabIndex={-1}
        className={cn(
          buttonVariants({
            size: 'icon-sm',
            color: 'secondary',
            className: 'rounded-full',
          }),
        )}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
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
    <form {...props} className={cn('flex items-start pe-2', props.className)} onSubmit={onStart}>
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask a question'}
        autoFocus
        className="p-3"
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
            buttonVariants({
              color: 'secondary',
              className: 'transition-all rounded-full mt-2',
            }),
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
        'flex items-start gap-3',
        isUser && 'flex-row-reverse'
      )}>
        {/* Avatar */}
        <div className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
          isUser
            ? 'bg-fd-primary text-fd-primary-foreground'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        )}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <img src="/favicon.svg" alt="Mello" className="w-4 h-4" />
          )}
        </div>

        <div className={cn(
          'flex-1 min-w-0 max-w-[85%]',
          isUser && 'flex flex-col items-end'
        )}>
          {/* Role name */}
          <p className={cn(
            'text-xs font-semibold mb-1.5 uppercase tracking-wide',
            isUser
              ? 'text-fd-muted-foreground'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600',
          )}>
            {roleName[message.role] ?? 'unknown'}
          </p>

          {/* Message content */}
          <div className={cn(
            'prose prose-sm max-w-none text-fd-foreground rounded-2xl px-4 py-3',
            isUser
              ? 'bg-fd-primary text-fd-primary-foreground prose-invert rounded-tr-sm'
              : 'bg-fd-muted/50 rounded-tl-sm'
          )}>
            <Markdown text={markdown} />
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
        'fixed bottom-4 gap-3 w-24 end-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] text-fd-muted-foreground rounded-2xl shadow-lg z-20 transition-[translate,opacity]',
        open && 'translate-y-10 opacity-0',
      )}
      onClick={() => setOpen(true)}
    >
      <MessageCircleIcon className="size-4.5" />
      Ask AI
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
                {chat.messages
                  .filter((msg) => msg.role !== 'system')
                  .map((item) => (
                    <Message key={item.id} message={item} />
                  ))}
              </div>
            </List>
            <div className="rounded-xl border bg-fd-card text-fd-card-foreground has-focus-visible:ring-2 has-focus-visible:ring-fd-ring">
              <SearchAIInput />
              <div className="flex items-center gap-1.5 p-1 empty:hidden">
                <SearchAIActions />
              </div>
            </div>
          </div>
        </div>
      </Presence>
    </>
  );
}
