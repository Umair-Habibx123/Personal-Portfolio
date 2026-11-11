import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Github, Linkedin, FileText } from 'lucide-react';
import site from '../lib/site';
import { Aurora, Heading, Reveal, ResumeLink } from './ui';
import VerifyStep from './VerifyStep';

const LIMITS = { name: 100, email: 200, subject: 150, message: 5000, hpx: 200 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const empty = { name: '', email: '', subject: '', message: '', hpx: '' };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email so I can reply.';
  if (v.message.trim().length < 10) e.message = 'A little more detail, please (at least 10 characters).';
  return e;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-3 flex justify-between font-medium text-timberWolf">
        {label}
        {optional && <span className="text-xs font-normal text-taupe">Optional</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-1.5 text-sm text-pink-300"
          >
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Contact() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | verify | sent | failed
  const [pending, setPending] = useState(null); // { token, email, expiresIn } while waiting for the code
  const [serverError, setServerError] = useState('');
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(Date.now());

  // The chat assistant's "Message Umair" button pre-fills the form
  useEffect(() => {
    const onPrefill = (e) => {
      const { subject = '', message = '' } = e.detail || {};
      setValues((v) => ({
        ...v,
        subject: v.subject || subject.slice(0, LIMITS.subject),
        message: v.message || (message ? `About: "${message}"

`.slice(0, LIMITS.message) : ''),
      }));
      setStatus((st) => (st === 'sent' ? 'idle' : st));
      setTimeout(() => document.getElementById('message')?.focus({ preventScroll: true }), 600);
    };
    window.addEventListener('prefill-contact', onPrefill);
    return () => window.removeEventListener('prefill-contact', onPrefill);
  }, []);

  const set = (k) => (e) => {
    const value = e.target.value.slice(0, LIMITS[k]);
    setValues((v) => ({ ...v, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'start', ...values, startedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
      // Step 2: the visitor confirms their email with the code we just sent
      setPending({ token: data.token, email: data.email ?? values.email.trim(), expiresIn: data.expiresIn ?? 600 });
      setStatus('verify');
    } catch (err) {
      setServerError(err.message);
      setStatus('failed');
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.links.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.links.email}`;
    }
  }

  const direct = [
    { href: site.links.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: site.links.github, label: 'GitHub', Icon: Github },
    { href: site.links.resume, label: 'Resume', Icon: FileText },
  ];

  return (
    <section id="contact" className="relative overflow-hidden bg-night py-24 sm:py-32">
      <Aurora section="contact" />
      <div className="container-x relative">
        <Heading eyebrow={site.contact.eyebrow} title={site.contact.title} dark />
        <Reveal>
          <p className="mt-4 max-w-2xl text-[18px] leading-[30px] text-taupe">{site.contact.text}</p>
        </Reveal>

        <div className="mt-12 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          {/* Original: the dark form panel */}
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-jet p-6 shadow-card sm:p-8">
              <AnimatePresence mode="wait">
                {status === 'verify' && pending ? (
                  <VerifyStep
                    key="verify"
                    pending={pending}
                    onResent={setPending}
                    onBack={() => {
                      setPending(null);
                      setStatus('idle');
                    }}
                    onVerified={() => {
                      setPending(null);
                      setValues(empty);
                      setStatus('sent');
                    }}
                  />
                ) : status === 'sent' ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-[460px] flex-col items-center justify-center text-center"
                    role="status"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white">
                      <Check size={30} />
                    </span>
                    <h3 className="mt-6 font-beckman text-2xl font-bold uppercase tracking-[1px] text-timberWolf">Message sent</h3>
                    <p className="mt-2 max-w-sm text-taupe">{site.contact.successText}</p>
                    <button
                      type="button"
                      className="btn-glass mt-8"
                      onClick={() => {
                        startedAt.current = Date.now();
                        setStatus('idle');
                      }}
                    >
                      SEND ANOTHER
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={onSubmit} noValidate className="flex flex-col gap-6 font-poppins" exit={{ opacity: 0 }}>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field id="name" label="Your Name" error={errors.name}>
                        <input
                          id="name"
                          className="field"
                          autoComplete="name"
                          placeholder="What's your name?"
                          value={values.name}
                          onChange={set('name')}
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                      </Field>
                      <Field id="email" label="Your Email" error={errors.email}>
                        <input
                          id="email"
                          type="email"
                          className="field"
                          autoComplete="email"
                          placeholder="What's your email?"
                          value={values.email}
                          onChange={set('email')}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                      </Field>
                    </div>
                    <Field id="subject" label="Subject" optional>
                      <input id="subject" className="field" placeholder="What's it about?" value={values.subject} onChange={set('subject')} />
                    </Field>
                    <Field id="message" label="Your Message" error={errors.message}>
                      <textarea
                        id="message"
                        rows={6}
                        className="field resize-y"
                        placeholder="What would you like to say?"
                        value={values.message}
                        onChange={set('message')}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : 'message-count'}
                      />
                      <p id="message-count" className="mt-1.5 text-right font-mono text-[11px] text-dim">
                        {values.message.length} / {LIMITS.message}
                      </p>
                    </Field>

                    {/* Honeypot: hidden from people, bots fill it in */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      {/* Named so browser autofill never fills it (a field called "company" got autofilled). */}
                      <label htmlFor="hpx">Leave this field empty</label>
                      <input id="hpx" name="hpx" type="text" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore value={values.hpx} onChange={set('hpx')} />
                    </div>

                    {status === 'failed' && (
                      <p role="alert" className="flex items-start gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 p-4 text-sm text-pink-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                          {serverError} You can also email me at{' '}
                          <a className="font-semibold underline" href={`mailto:${site.links.email}`}>
                            {site.links.email}
                          </a>
                          .
                        </span>
                      </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                      <button type="submit" disabled={status === 'sending'} className="btn-accent self-start !px-8 !py-4 disabled:cursor-wait disabled:opacity-70">
                        {status === 'sending' ? (
                          <>
                            <Loader2 size={18} className="animate-spin" aria-hidden="true" /> SENDING CODE…
                          </>
                        ) : (
                          'SEND MESSAGE'
                        )}
                      </button>
                      <p className="text-xs leading-relaxed text-taupe">I'll email you a 6-digit code to confirm it's really you.</p>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="space-y-4">
            <div className="glass-dark rounded-2xl p-6">
              <p className="text-sm text-taupe">Email me directly</p>
              <a href={`mailto:${site.links.email}`} className="mt-2 block break-all text-xl font-bold text-timberWolf hover:text-pink-300">
                {site.links.email}
              </a>
              <button type="button" onClick={copyEmail} className="btn-glass mt-5 !px-4 !py-2 !text-xs" aria-live="polite">
                {copied ? 'COPIED!' : 'COPY EMAIL'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {direct.map(({ href, label, Icon }) => {
                const cls =
                  'glass-dark group flex flex-col items-center gap-2 rounded-2xl py-5 text-sm text-timberWolf transition hover:-translate-y-1 hover:border-white/25 hover:text-white';
                const inner = (
                  <>
                    <Icon size={20} className="transition group-hover:text-pink-300" aria-hidden="true" />
                    {label}
                  </>
                );
                return label === 'Resume' ? (
                  <ResumeLink key={label} className={cls}>
                    {inner}
                  </ResumeLink>
                ) : (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className={cls}>
                    {inner}
                  </a>
                );
              })}
            </div>
            <div className="glass-dark pulse-border relative rounded-2xl p-6">
              <p className="relative font-mono text-[11px] uppercase tracking-widest text-taupe">Based in</p>
              <p className="relative mt-1 font-beckman text-lg font-bold tracking-[1px] text-timberWolf">{site.profile.location}</p>
              <p className="relative mt-1 text-sm text-taupe">{site.profile.availability}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
