// "Ask Umair" chat, in the style of a draggable prompt button:
// - the button can be dragged and flung anywhere; near a dock spot it snaps to it
// - clicking it morphs the button into a compact prompt box (GSAP Flip)
// - after the first question the box grows into a full conversation
// - minimise (or Esc) morphs it back into the button
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Flip } from 'gsap/Flip';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Atom, CornerDownLeft, FileText, Loader2, Mail, Minimize2, RotateCcw } from 'lucide-react';
import { ResumeLink } from '../ui';
import { Actions, newId, parse, Rich, SUGGESTIONS } from './format';
import { BACK_TO_TOP_AFTER, SIZE, loadPos, savePos, settle, toPos, toPx } from './spots';
import { launcherClass } from './AskLauncher';
import { getVisitorId } from '../../lib/visitor';
import ChatMascot from './ChatMascot';
import RobotFace from './RobotFace';

// The conversation is kept in this browser so a refresh or closing the chat
// doesn't lose it; the server also keeps it under the visitor ID.
const STORE = 'pf-chat';
function loadLocal() {
  try {
    const c = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (c && Array.isArray(c.messages) && typeof c.conversationId === 'string') return c;
  } catch {
    /* ignore */
  }
  return null;
}
function saveLocal(c) {
  try {
    if (c) localStorage.setItem(STORE, JSON.stringify(c));
    else localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
}

gsap.registerPlugin(Draggable, Flip, InertiaPlugin);

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DURATION = () => (reduced() ? 0.01 : 0.42);
const FLIP_PROPS = 'borderRadius,opacity,filter';

/** Size and position of the open box, anchored next to where the button sits. */
function boxLayout(center, expanded) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const base = { x: 0, y: 0, top: 'auto', bottom: 'auto', left: 'auto', right: 'auto', borderRadius: 18 };
  if (W < 640) {
    // phones: full width; the conversation takes the whole screen
    return expanded
      ? { ...base, left: 12, top: 12, width: W - 24, height: H - 24 }
      : { ...base, left: 12, bottom: 12, width: W - 24, height: 'auto' };
  }
  const width = Math.min(410, W - 32);
  const out = { ...base, width };
  if (center.x < width / 2 + 24) out.left = 24;
  else if (center.x > W - width / 2 - 24) out.right = 24;
  else out.left = Math.round(center.x - width / 2);

  const edge = SIZE / 2;
  let room;
  if (center.y >= H / 2) {
    out.bottom = Math.max(12, Math.round(H - center.y - edge));
    room = H - out.bottom - 12;
  } else {
    out.top = Math.max(12, Math.round(center.y - edge));
    room = H - out.top - 12;
  }
  out.height = expanded ? Math.min(600, room) : 'auto';
  return out;
}

export default function AskWidget({ openOnMount = false }) {
  const [open, setOpen] = useState(false);
  const saved = useRef(loadLocal());
  const [messages, setMessages] = useState(() => saved.current?.messages ?? []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const handleRef = useRef(null);
  const headRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const pos = useRef(loadPos());
  const boxMoved = useRef(false);
  const growState = useRef(null);
  const closing = useRef(false);
  const conversationId = useRef(saved.current?.conversationId ?? newId());
  const visitorId = useRef(getVisitorId());
  const expanded = messages.length > 0;

  const place = useCallback((position, animate = false) => {
    const p = toPx(position);
    pos.current = position;
    gsap[animate ? 'to' : 'set'](btnRef.current, { x: p.x, y: p.y, xPercent: -50, yPercent: -50, duration: 0.35, ease: 'power3.out' });
  }, []);

  // ── The button: place it, make it draggable, keep it docked on resize ──
  useLayoutEffect(() => {
    const btn = btnRef.current;
    place(pos.current);
    const land = (d) => {
      const next = toPos(settle({ x: d.x, y: d.y }));
      savePos(next);
      place(next, true);
    };
    const [drag] = Draggable.create(btn, {
      type: 'x,y',
      inertia: true,
      dragClickables: true,
      minimumMovement: 6,
      bounds: window,
      edgeResistance: 0.75,
      snap: { points: (pt) => settle(pt) },
      onClick: () => setOpen(true),
      onDragEnd() {
        if (!this.isThrowing) land(this);
      },
      onThrowComplete() {
        land(this);
      },
    });
    const onResize = () => !drag.isDragging && place(pos.current);
    window.addEventListener('resize', onResize);
    // docked above WhatsApp: slide up/down with the stack as back-to-top appears
    let lifted = window.scrollY > BACK_TO_TOP_AFTER;
    const onScroll = () => {
      const now = window.scrollY > BACK_TO_TOP_AFTER;
      if (now === lifted) return;
      lifted = now;
      if (pos.current?.dock && !drag.isDragging && !drag.isThrowing) place(pos.current, true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (openOnMount) setOpen(true);
    return () => {
      drag.kill();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [place, openOnMount]);

  // ── Open: morph the button into the box ──
  useLayoutEffect(() => {
    if (!open) return undefined;
    const box = boxRef.current;
    const content = contentRef.current;
    const b = btnRef.current.getBoundingClientRect();
    boxMoved.current = false;
    gsap.set(box, { top: b.top, left: b.left, right: 'auto', bottom: 'auto', width: b.width, height: b.height, borderRadius: b.width / 2, x: 0, y: 0 });
    gsap.set(content, { opacity: 0, filter: 'blur(4px)' });
    const state = Flip.getState([box, content], { props: FLIP_PROPS });
    gsap.set(box, boxLayout(toPx(pos.current), messages.length > 0));
    gsap.set(content, { opacity: 1, filter: 'blur(0px)' });
    gsap.set(btnRef.current, { autoAlpha: 0 });
    Flip.from(state, { duration: DURATION(), ease: 'power2.inOut', nested: true, onComplete: () => inputRef.current?.focus() });

    // drag the open box by its handle (not on phones, where it's full width)
    const triggers = [handleRef.current, headRef.current].filter(Boolean);
    const [drag] =
      window.innerWidth >= 640
        ? Draggable.create(box, { type: 'x,y', trigger: triggers, inertia: true, bounds: window, onDragStart: () => (boxMoved.current = true) })
        : [null];
    return () => drag?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── First question: grow the compact box into the conversation (and back on "new chat") ──
  useLayoutEffect(() => {
    if (!open || !growState.current) return;
    const box = boxRef.current;
    const r = box.getBoundingClientRect();
    const center = boxMoved.current ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : toPx(pos.current);
    if (boxMoved.current) {
      // keep it where it was dragged: re-anchor around its current spot
      gsap.set(box, boxLayout(center, expanded));
      gsap.set(box, { x: 0, y: 0 });
    } else {
      gsap.set(box, boxLayout(center, expanded));
    }
    Flip.from(growState.current, { duration: DURATION(), ease: 'power2.inOut' });
    growState.current = null;
  }, [expanded, open]);

  const close = useCallback(() => {
    if (closing.current || !boxRef.current) return;
    closing.current = true;
    const box = boxRef.current;
    const content = contentRef.current;
    if (boxMoved.current) {
      // the box was dragged: the button docks at the spot nearest to it
      const r = box.getBoundingClientRect();
      const f = toPos(settle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }));
      savePos(f);
      place(f);
    }
    const b = btnRef.current.getBoundingClientRect();
    const state = Flip.getState([box, content], { props: FLIP_PROPS });
    gsap.set(box, { top: b.top, left: b.left, right: 'auto', bottom: 'auto', width: b.width, height: b.height, borderRadius: b.width / 2, x: 0, y: 0 });
    gsap.set(content, { opacity: 0, filter: 'blur(4px)' });
    Flip.from(state, {
      duration: DURATION(),
      ease: 'power2.inOut',
      nested: true,
      onComplete: () => {
        gsap.set(btnRef.current, { autoAlpha: 1 });
        closing.current = false;
        setOpen(false);
        btnRef.current?.focus({ preventScroll: true });
      },
    });
  }, [place]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Nothing saved in this browser at all? Ask the server for this visitor's
  // last chat. (After "Clear chat" the browser keeps an empty record, so a
  // cleared chat doesn't come back; the server copy is kept.)
  useEffect(() => {
    if (saved.current || !visitorId.current) return undefined;
    let cancelled = false;
    fetch(`/api/chat?visitor=${visitorId.current}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d?.conversation;
        if (cancelled || !c?.messages?.length) return;
        setMessages((current) => {
          if (current.length) return current; // they already started a new one
          conversationId.current = c.conversationId;
          if (boxRef.current) growState.current = Flip.getState(boxRef.current);
          return c.messages.filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string');
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the finished conversation in this browser
  useEffect(() => {
    if (busy) return;
    const done = messages.filter((m) => m.text);
    saveLocal({ conversationId: conversationId.current, messages: done.slice(-40) });
  }, [messages, busy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function captureGrow() {
    if (boxRef.current) growState.current = Flip.getState(boxRef.current);
  }

  async function send(text) {
    const q = text.trim().slice(0, 500);
    if (!q || busy) return;
    setError('');
    setInput('');
    const history = [...messages, { role: 'user', text: q }];
    if (!messages.length) captureGrow();
    setMessages([...history, { role: 'assistant', text: '' }]);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationId.current, visitorId: visitorId.current, messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "The assistant can't answer right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: 'assistant', text: answer }]);
      }
    } catch (err) {
      setMessages((m) => m.filter((x) => !(x.role === 'assistant' && !x.text)));
      setError(err.message);
    } finally {
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  /** Clears the chat in this browser and starts a new one (the server copy stays). */
  function newChat() {
    captureGrow();
    saved.current = { conversationId: '', messages: [] };
    setMessages([]);
    setError('');
    conversationId.current = newId();
  }

  function toContact() {
    const lastQ = [...messages].reverse().find((m) => m.role === 'user')?.text ?? '';
    window.dispatchEvent(new CustomEvent('prefill-contact', { detail: { subject: 'From the chat on your portfolio', message: lastQ } }));
    close();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }

  const iconBtn =
    'grid h-8 w-8 place-items-center rounded-md text-timberWolf/60 transition hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Ask my AI assistant about my work (drag to move)"
        title="Ask my AI about my work · drag to move"
        aria-expanded={open}
        // pointer clicks come from Draggable's onClick; this handles the keyboard
        onClick={(e) => e.detail === 0 && setOpen(true)}
        className={launcherClass}
        style={{ width: SIZE, height: SIZE }}
      >
        <RobotFace size={42} />
      </button>

      {open && (
        <div
          ref={boxRef}
          role="dialog"
          aria-label="Ask about Umair"
          className="fixed z-[70] flex flex-col overflow-hidden border border-white/15 bg-night/95 p-1 text-timberWolf shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(139,92,246,0.15)] backdrop-blur-xl"
        >
          <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
            {expanded && (
              <div ref={headRef} className="flex cursor-grab items-center gap-2 border-b border-white/10 px-3 py-2.5 active:cursor-grabbing">
                <ChatMascot size={36} online />
                <p className="flex-1 select-none text-xs text-taupe">
                  <span className="font-semibold text-white">Ask about Umair</span> · answers from his portfolio
                </p>
                <button
                  type="button"
                  onClick={newChat}
                  disabled={busy}
                  title="Clear this chat and start a new one"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-taupe transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw size={12} aria-hidden="true" /> Clear chat
                </button>
              </div>
            )}

            {expanded ? (
              <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4" aria-live="polite">
                {messages.map((m, i) => {
                  if (m.role === 'user') {
                    return (
                      <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-accent px-3.5 py-2 text-sm text-white">
                        {m.text}
                      </div>
                    );
                  }
                  const { text, actions } = parse(m.text);
                  const streaming = busy && i === messages.length - 1;
                  return (
                    <div key={i} className="max-w-[92%]">
                      <div className="space-y-2 text-sm leading-relaxed">
                        {text ? <Rich text={text} /> : <Loader2 size={16} className="animate-spin text-taupe" aria-label="Thinking" />}
                      </div>
                      {!streaming && <Actions actions={actions} onContact={toContact} />}
                    </div>
                  );
                })}
                {error && (
                  <p role="alert" className="rounded-xl border border-pink-400/30 bg-pink-500/10 px-3 py-2 text-xs text-pink-200">
                    {error}{' '}
                    <button type="button" className="font-semibold underline" onClick={toContact}>
                      Message Umair instead
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <>
              <div className="flex items-center gap-3 px-2 pt-2">
                <ChatMascot size={48} online />
                <p className="text-[13px] leading-snug text-timberWolf">
                  <span className="font-semibold text-white">Hi! I'm Umair's AI assistant.</span> 
                </p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto px-2 pb-1 pt-2 [scrollbar-width:none]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-taupe transition hover:border-pink-400/50 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
              </>
            )}

            <form
              className={expanded ? 'border-t border-white/10 pt-1' : ''}
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={expanded ? 'Ask a follow-up…' : 'What do you want to build? Or ask about my work…'}
                aria-label="Your question"
                style={{ boxShadow: 'none', outline: 'none' }}
                autoComplete="off"
                data-gramm="false"
                className="block w-full resize-none !border-0 !bg-transparent px-2.5 py-2 text-sm text-white caret-pink-400 placeholder:text-dim"
              />
              <div className="flex h-9 items-center justify-between pl-1">
                <div className="flex items-center gap-0.5">
                  <span
                    ref={handleRef}
                    title="Drag to move"
                    className={`grid h-8 w-8 place-items-center text-pink-300 ${typeof window !== 'undefined' && window.innerWidth >= 640 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <Atom size={16} aria-hidden="true" />
                  </span>
                  <ResumeLink className={iconBtn} aria-label="Download resume" title="Resume">
                    <FileText size={15} />
                  </ResumeLink>
                  <button type="button" onClick={toContact} className={iconBtn} aria-label="Message Umair" title="Message Umair">
                    <Mail size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={close} className={iconBtn} aria-label="Minimise chat" title="Minimise (Esc)">
                    <Minimize2 size={15} />
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="grid h-8 w-8 place-items-center rounded-md bg-white text-night transition hover:bg-pink-100 disabled:opacity-40"
                    aria-label="Send"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <CornerDownLeft size={15} />}
                  </button>
                </div>
              </div>
              <p className="px-2.5 pb-1.5 pt-0.5 text-[10px] leading-snug text-dim">
                AI assistant, can make mistakes. 
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
