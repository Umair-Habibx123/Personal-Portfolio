// Shared pieces of the "Ask Umair" chat: suggested questions, and turning the
// assistant's text (with [[tags]]) into paragraphs, bullets and buttons.
import { ExternalLink, Download, Mail } from 'lucide-react';
import site from '../../lib/site';
import { ResumeLink } from '../ui';

export const SUGGESTIONS = [
  'Summarise Umair in 30 seconds',
  'I have a project idea',
  'What has he built with Next.js?',
  'Show me his Flutter apps',
  'Is he available for freelance work?',
];

const TAG = /\[\[(\w+)(?::([^\]]+))?\]\]/g;

/** Splits the assistant's text into readable text and action tags. */
export function parse(text) {
  const actions = [];
  const seen = new Set();
  const lines = text.split('\n').map((line) => {
    // a line of only tags becomes buttons and disappears from the text
    const onlyTags = line.trim() && !line.replace(TAG, '').trim();
    return line.replace(TAG, (_, kind, value) => {
      const k = kind.toLowerCase();
      const v = value?.trim();
      if (!seen.has(`${k}:${v}`)) {
        seen.add(`${k}:${v}`);
        actions.push({ kind: k, value: v });
      }
      // inside a sentence, keep the project's name readable
      return !onlyTags && k === 'project' && v ? v : '';
    });
  });
  // hide a half-streamed tag at the very end ("[[proj")
  const clean = lines.join('\n').replace(/\[\[[^\]]*$/, '').replace(/\n{3,}/g, '\n\n');
  return { text: clean.trim(), actions };
}

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

/** Paragraphs and bullet lists from plain text (a sentence followed by bullets works too). */
export function Rich({ text }) {
  const out = [];
  for (const [bi, block] of text.split(/\n{2,}/).filter(Boolean).entries()) {
    let para = [];
    let list = [];
    const flush = (k) => {
      if (para.length) {
        out.push(
          <p key={`${bi}p${k}`}>
            {para.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </span>
            ))}
          </p>,
        );
        para = [];
      }
      if (list.length) {
        out.push(
          <ul key={`${bi}u${k}`} className="ml-4 list-disc space-y-1 marker:text-pink-400">
            {list.map((l, j) => (
              <li key={j}>
                <Inline text={l} />
              </li>
            ))}
          </ul>,
        );
        list = [];
      }
    };
    block.split('\n').filter((l) => l.trim()).forEach((line, k) => {
      const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
      if (bullet) {
        if (para.length) flush(k);
        list.push(bullet[1]);
      } else {
        if (list.length) flush(k);
        para.push(line);
      }
    });
    flush('end');
  }
  return out;
}

export function Actions({ actions, onContact }) {
  const sources = actions.filter((a) => a.kind === 'source' && a.value);
  const rest = actions.filter((a) => a.kind !== 'source');
  if (!actions.length) return null;
  const btn =
    'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-pink-400/60 hover:bg-white/15';
  return (
    <div className="mt-3 space-y-2">
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((a, i) => {
            if (a.kind === 'project') {
              const p = site.projects.items.find((x) => x.name.toLowerCase() === (a.value || '').toLowerCase());
              if (!p) return null;
              const href = p.links?.live || p.links?.apk || p.links?.github;
              return (
                <a key={i} href={href} target="_blank" rel="noreferrer" className={btn}>
                  View {p.name} <ExternalLink size={12} />
                </a>
              );
            }
            if (a.kind === 'upwork' && site.links.upwork) {
              return (
                <a key={i} href={site.links.upwork} target="_blank" rel="noreferrer" className={btn}>
                  View on Upwork <ExternalLink size={12} />
                </a>
              );
            }
            if (a.kind === 'contact') {
              return (
                <button key={i} type="button" onClick={onContact} className={btn}>
                  <Mail size={12} /> Message Umair
                </button>
              );
            }
            if (a.kind === 'whatsapp' && site.links.whatsapp) {
              return (
                <a key={i} href={site.links.whatsapp} target="_blank" rel="noreferrer" className={btn}>
                  WhatsApp
                </a>
              );
            }
            if (a.kind === 'resume') {
              return (
                <ResumeLink key={i} className={btn}>
                  <Download size={12} /> Resume
                </ResumeLink>
              );
            }
            return null;
          })}
        </div>
      )}
      {sources.length > 0 && <p className="text-[11px] text-taupe">From: {sources.map((s) => s.value).join(' · ')}</p>}
    </div>
  );
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
