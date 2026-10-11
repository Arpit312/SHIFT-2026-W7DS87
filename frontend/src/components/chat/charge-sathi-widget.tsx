'use client';

import { ChargeSathiLogo } from '@/components/brand/charge-sathi-logo';
import { SafeReply, historyFromMessages } from '@/components/chat/safe-reply';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { CHARGESATHI_DISCLAIMER, CHARGESATHI_STARTERS, ROLES } from '@/lib/constants';
import { api, ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Eraser, RotateCcw, Send, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

type ChatRole = 'user' | 'assistant';

interface UiMessage {
  id: string;
  role: ChatRole;
  content: string;
  severity?: 'low' | 'medium' | 'high' | null;
  error?: boolean;
  retryText?: string;
}

const SEVERITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Routine',
  medium: 'Check before charging again',
  high: 'Stop and stay clear',
};

const SEVERITY_CLASS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-danger/15 text-danger',
};

export function ChargeSathiWidget({ assessmentId, initialOpen }: { assessmentId?: number | string; initialOpen?: boolean }) {
  const { profile, isLoading } = useAuth();
  const [open, setOpen] = useState(initialOpen ?? false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const liveId = useId();

  const isOwner = profile?.role === ROLES.EV_OWNER;
  const hasAssessmentContext = !!assessmentId;

  // Assessment-specific starter questions shown on the report page
  const ASSESSMENT_STARTERS = [
    'Why was my parking space flagged?',
    'What corrective actions should I take?',
    'Which issues require an electrician?',
    'What additional photo or information is needed?',
  ];

  const starters = hasAssessmentContext ? ASSESSMENT_STARTERS : CHARGESATHI_STARTERS;
  const introText = hasAssessmentContext
    ? 'I have the details of your parking photo screening. Ask me about the findings, what to fix, or what an electrician needs to check.'
    : 'Ask about EV charging or the ChargeNOC request process. I do not see your own request, bills, or conditions.';

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const mobile = window.matchMedia('(max-width: 1023px)').matches;
    if (mobile) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    const userMsg: UiMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: 'user',
      content: trimmed,
    };
    const history = historyFromMessages(messages);
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    try {
      const result = await api.sendChat({ 
        message: trimmed, 
        history,
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${crypto.randomUUID()}`,
          role: 'assistant',
          content: result.reply,
          severity: result.severity,
        },
      ]);
    } catch (err) {
      const detail =
        err instanceof ApiRequestError
          ? err.message
          : 'ChargeSathi could not get an answer. Try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${crypto.randomUUID()}`,
          role: 'assistant',
          content: detail,
          error: true,
          retryText: trimmed,
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  };

  if (isLoading || !isOwner) {
    return null;
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={cn(
          'fixed z-40 bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
          'bg-brand-orange text-background hover:bg-brand-orange-hover',
          'flex items-center justify-center',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <ChargeSathiLogo size={28} variant="mark" />
        <span className="sr-only">{open ? 'Close ChargeSathi' : 'Open ChargeSathi'}</span>
      </button>

      {open ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'fixed z-40 flex flex-col bg-surface border border-cn-border shadow-lg',
            'inset-0 lg:inset-auto lg:right-6 lg:bottom-24 lg:top-20 lg:w-[min(100%-3rem,24rem)] lg:rounded-xl',
            'motion-safe:transition-opacity motion-safe:duration-200',
          )}
        >
          <header className="flex items-center gap-3 px-4 py-3 border-b border-cn-border">
            <ChargeSathiLogo size={32} variant="mark" />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-heading font-semibold text-text-primary">
                ChargeSathi
              </h2>
              <p className="text-xs text-text-muted">{CHARGESATHI_DISCLAIMER}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Clear conversation"
              onClick={() => setMessages([])}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Close ChargeSathi"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div
            id={liveId}
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-thin"
          >
            <p className="text-sm text-text-muted">
                {introText}
              </p>
            {messages.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {starters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(starter)}
                    className="text-left text-sm rounded-full border border-cn-border bg-elevated px-3 py-2 text-text-primary hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((msg) => (
              <article
                key={msg.id}
                className={cn(
                  'max-w-[94%] rounded-xl px-3 py-2',
                  msg.role === 'user'
                    ? 'ml-auto bg-elevated text-text-primary'
                    : 'mr-auto border border-cn-border bg-background',
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="mb-2">
                    <ChargeSathiLogo size={20} variant="mark" />
                  </div>
                ) : null}
                {msg.severity && SEVERITY_LABEL[msg.severity] ? (
                  <span
                    className={cn(
                      'inline-flex text-xs font-medium rounded-full px-2 py-0.5 mb-2',
                      SEVERITY_CLASS[msg.severity],
                    )}
                  >
                    {SEVERITY_LABEL[msg.severity]}
                  </span>
                ) : null}
                {msg.role === 'assistant' && !msg.error ? (
                  <SafeReply text={msg.content} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.error && msg.retryText ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const retry = msg.retryText ?? '';
                      setMessages((prev) => {
                        const idx = prev.findIndex((m) => m.id === msg.id);
                        return prev.filter((m, i) => {
                          if (m.id === msg.id) return false;
                          if (i === idx - 1 && m.role === 'user' && m.content === retry) return false;
                          return true;
                        });
                      });
                      void send(retry);
                    }}
                  >
                    Retry
                  </Button>
                ) : null}
              </article>
            ))}
            {busy ? (
              <p className="text-sm text-text-muted" aria-live="polite">
                ChargeSathi is typing…
              </p>
            ) : null}
          </div>

          <p className="px-4 text-xs text-text-muted">{CHARGESATHI_DISCLAIMER}</p>

          <form
            className="flex items-end gap-2 p-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor="chargesathi-input" className="sr-only">
              Message ChargeSathi
            </label>
            <textarea
              id="chargesathi-input"
              ref={inputRef}
              rows={1}
              value={input}
              disabled={busy}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onComposerKey}
              placeholder="Ask about charging or ChargeNOC…"
              className={cn(
                'flex-1 min-h-11 max-h-36 resize-none rounded-md border border-cn-border bg-background px-3 py-2 text-sm text-text-primary',
                'placeholder:text-text-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            />
            <Button type="submit" size="md" disabled={busy || !input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      ) : null}
    </>
  );
}
