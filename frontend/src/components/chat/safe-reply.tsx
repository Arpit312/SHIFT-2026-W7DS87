import type { ReactNode } from 'react';

const URL_RE = /(https?:\/\/[^\s<]+)/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;
const OL_RE = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const UL_RE = /^\s*[-•*]\s+(.*)$/;

function inlineNodes(text: string, keyPrefix: string): ReactNode[] {
  const withBold: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const bold = new RegExp(BOLD_RE.source, 'g');
  while ((match = bold.exec(text)) !== null) {
    if (match.index > last) {
      withBold.push(...linkNodes(text.slice(last, match.index), `${keyPrefix}-t${last}`));
    }
    withBold.push(
      <strong key={`${keyPrefix}-b${match.index}`} className="font-semibold">
        {linkNodes(match[1], `${keyPrefix}-bt${match.index}`)}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    withBold.push(...linkNodes(text.slice(last), `${keyPrefix}-t${last}`));
  }
  return withBold;
}

function linkNodes(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0;
      const href = part.replace(/[),.;]+$/, '');
      const trailing = part.slice(href.length);
      return (
        <span key={`${keyPrefix}-${i}`}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange underline underline-offset-2"
          >
            {href}
          </a>
          {trailing}
        </span>
      );
    }
    URL_RE.lastIndex = 0;
    return part ? <span key={`${keyPrefix}-${i}`}>{part}</span> : null;
  });
}

export function SafeReply({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let list: { kind: 'ol' | 'ul'; items: ReactNode[] } | null = null;

  const flushList = () => {
    if (!list) return;
    const Tag = list.kind;
    blocks.push(
      <Tag key={`list-${blocks.length}`} className="my-2 pl-5 space-y-1">
        {list.items}
      </Tag>,
    );
    list = null;
  };

  lines.forEach((raw, index) => {
    const line = raw.replace(/\s+$/, '');
    const ol = line.match(OL_RE);
    const ul = line.match(UL_RE);
    if (ol) {
      if (list?.kind !== 'ol') {
        flushList();
        list = { kind: 'ol', items: [] };
      }
      list.items.push(
        <li key={`li-${index}`} value={Number.parseInt(ol[1], 10)}>
          {inlineNodes(ol[2], `ol-${index}`)}
        </li>,
      );
      return;
    }
    if (ul) {
      if (list?.kind !== 'ul') {
        flushList();
        list = { kind: 'ul', items: [] };
      }
      list.items.push(
        <li key={`li-${index}`}>{inlineNodes(ul[1], `ul-${index}`)}</li>,
      );
      return;
    }
    flushList();
    if (!line.trim()) return;
    blocks.push(
      <p key={`p-${index}`} className="mb-2 last:mb-0">
        {inlineNodes(line.trim(), `p-${index}`)}
      </p>,
    );
  });
  flushList();

  return <div className="text-sm leading-relaxed text-text-primary">{blocks}</div>;
}

export function historyFromMessages(
  messages: { role: 'user' | 'assistant'; content: string; error?: boolean }[],
): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((m) => !m.error && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));
}
