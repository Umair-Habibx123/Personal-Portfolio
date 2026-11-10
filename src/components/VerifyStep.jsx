import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

async function post(body) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || 'Something went wrong.');
    err.expired = !!data.expired;
    throw err;
  }
  return data;
}

/**
 * Step 2 of the contact form: the visitor types the 6-digit code we emailed
 * them. Only then is the message delivered (see server/contact.js).
 */
export default function VerifyStep({ pending, onVerified, onBack, onResent }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | checking | resending
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [left, setLeft] = useState(pending.expiresIn);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const boxes = useRef([]);

  // countdowns: code expiry and the resend button
  useEffect(() => {
    setLeft(pending.expiresIn);
    setCooldown(RESEND_COOLDOWN);
    setExpired(false);
    const t = setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    boxes.current[0]?.focus();
    return () => clearInterval(t);
  }, [pending]);

  useEffect(() => {
    if (left === 0) setExpired(true);
  }, [left]);

  async function check(code) {
    if (status !== 'idle' || expired) return;
    setStatus('checking');
    setError('');
    try {
      await post({ step: 'verify', token: pending.token, code });
      onVerified();
    } catch (err) {
      setError(err.message);
      if (err.expired) setExpired(true);
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      setTimeout(() => boxes.current[0]?.focus(), 0);
    }
  }

  function put(i, value) {
    const only = value.replace(/\D/g, '');
    if (!only) {
      setDigits((d) => d.map((x, k) => (k === i ? '' : x)));
      return;
    }
    // typing one digit, or pasting / autofilling several
    const next = [...digits];
    only
      .slice(0, 6 - i)
      .split('')
      .forEach((ch, k) => (next[i + k] = ch));
    setDigits(next);
    const filled = next.findIndex((x) => !x);
    boxes.current[filled === -1 ? 5 : filled]?.focus();
    if (filled === -1) check(next.join(''));
  }

  function onKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1]?.focus();
  }

  async function resend() {
    setStatus('resending');
    setError('');
    try {
      const data = await post({ step: 'resend', token: pending.token });
      setDigits(['', '', '', '', '', '']);
      onResent({ token: data.token, email: data.email ?? pending.email, expiresIn: data.expiresIn });
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('idle');
    }
  }

  const code = digits.join('');

  return (
    <motion.div
      key="verify"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[460px] flex-col items-center justify-center text-center"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-pink-300">Step 2 of 2</p>
      <h3 className="mt-3 font-beckman text-2xl font-bold uppercase tracking-[1px] text-timberWolf">Check your email</h3>
      <p className="mt-3 max-w-md text-taupe">
        I sent a 6-digit code to <span className="break-all font-semibold text-white">{pending.email}</span>. Enter it here and your message is on
        its way.
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) check(code);
        }}
      >
        <fieldset disabled={status === 'checking' || expired} className="flex justify-center gap-2 sm:gap-3">
          <legend className="sr-only">Verification code</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (boxes.current[i] = el)}
              value={d}
              onChange={(e) => put(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={i === 0 ? 6 : 1}
              aria-label={`Digit ${i + 1}`}
              className="h-14 w-11 rounded-xl border border-white/10 bg-jetLight text-center font-display text-2xl font-extrabold text-white transition focus:border-pink-400/70 focus:outline-none focus:ring-4 focus:ring-pink-500/20 disabled:opacity-50 sm:h-16 sm:w-14"
            />
          ))}
        </fieldset>

        <button type="submit" disabled={code.length !== 6 || status === 'checking' || expired} className="btn-accent mt-6 !px-8 disabled:cursor-not-allowed disabled:opacity-50">
          {status === 'checking' ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" /> CHECKING…
            </>
          ) : (
            'VERIFY AND SEND'
          )}
        </button>
      </form>

      <div aria-live="polite" className="mt-5 min-h-[1.5rem] text-sm">
        {error ? (
          <p role="alert" className="flex items-center justify-center gap-1.5 text-pink-300">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </p>
        ) : expired ? (
          <p className="text-pink-300">This code has expired. Ask for a new one below.</p>
        ) : (
          <p className="text-taupe">
            Code expires in <span className="font-mono text-timberWolf">{mmss(left)}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={(cooldown > 0 && !expired) || status === 'resending'}
          className="font-semibold text-timberWolf underline decoration-pink-500 decoration-2 underline-offset-4 transition hover:text-white disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        >
          {status === 'resending' ? 'Sending…' : cooldown > 0 && !expired ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </button>
        <button type="button" onClick={onBack} className="text-taupe transition hover:text-white">
          Wrong email? Edit message
        </button>
      </div>
      <p className="mt-6 max-w-sm text-xs text-dim">Can't find it? Check your spam or promotions folder.</p>
    </motion.div>
  );
}
