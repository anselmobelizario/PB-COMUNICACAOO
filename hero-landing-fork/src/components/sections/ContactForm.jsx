import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import { siteData } from '../../data/siteData';
import { buildWhatsAppLink } from '../../utils/whatsapp';

const INITIAL_STATE = { name: '', company: '', contact: '', message: '', consent: false };

const FIELD_LIMITS = { name: 100, company: 120, contact: 120, message: 1500 };
const MAX_URL_LENGTH = 6000;
const STATUS_TIMEOUT_MS = 6000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeLine(value) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function countDigits(value) {
  return (value.match(/\d/g) || []).length;
}

function isValidContact(value) {
  const trimmed = value.trim();
  if (EMAIL_REGEX.test(trimmed)) return true;
  return countDigits(trimmed) >= 10;
}

function buildMessage({ name, company, contact, message }) {
  return [
    'Olá! Gostaria de solicitar um orçamento.',
    '',
    `Nome: ${sanitizeLine(name)}`,
    company ? `Empresa: ${sanitizeLine(company)}` : null,
    `Contato: ${sanitizeLine(contact)}`,
    '',
    'Projeto:',
    message.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}

function buildMailtoUrl(form) {
  const subject = encodeURIComponent(`Orçamento — ${sanitizeLine(form.name)}`);
  const body = encodeURIComponent(buildMessage(form));
  return `mailto:${siteData.contact.email}?subject=${subject}&body=${body}`;
}

function buildWhatsAppUrl(form) {
  return buildWhatsAppLink(siteData.contact.whatsappPhone, buildMessage(form));
}

export default function ContactForm() {
  const revealRef = useReveal();
  const formRef = useRef(null);
  const lgpdNoteId = useId();
  const consentId = useId();
  const [form, setForm] = useState(INITIAL_STATE);
  const [status, setStatus] = useState('idle');
  const statusTimerRef = useRef(null);
  const { form: copy } = siteData;

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // The invalid markers only exist after this render commits.
    if (status !== 'invalid') return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [status]);

  const scheduleStatusReset = () => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus('idle'), STATUS_TIMEOUT_MS);
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validationErrors = {
    name: form.name.trim().length < 2 ? 'Informe seu nome.' : null,
    contact: !isValidContact(form.contact)
      ? 'Use um e-mail válido ou telefone com DDD.'
      : null,
    message:
      form.message.trim().length < 10 ? 'Conte um pouco mais sobre o projeto.' : null,
    consent: !form.consent ? 'É necessário aceitar o uso dos dados.' : null,
  };

  const isValid = Object.values(validationErrors).every((e) => e === null);

  const deliver = (channel) => {
    if (!isValid) {
      setStatus('invalid');
      return;
    }

    const url = channel === 'email' ? buildMailtoUrl(form) : buildWhatsAppUrl(form);

    if (url.length > MAX_URL_LENGTH) {
      setStatus('too-long');
      scheduleStatusReset();
      return;
    }

    if (channel === 'email') {
      // A mailto navigation can't be confirmed (no client installed = nothing
      // happens), so the draft stays and the copy tells the user what to do.
      window.location.href = url;
      setStatus('sent-email');
      scheduleStatusReset();
      return;
    }

    // 'noopener' in the features string makes window.open return null by spec,
    // which read as a blocked popup on every successful send — open plainly
    // and sever the opener afterwards instead.
    const opened = window.open(url, '_blank');
    if (!opened) {
      setStatus('blocked');
      scheduleStatusReset();
      return;
    }
    opened.opener = null;

    setForm(INITIAL_STATE);
    setStatus('sent-whatsapp');
    scheduleStatusReset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    deliver('whatsapp');
  };

  const showErrors = status === 'invalid';

  return (
    <section
      id={copy.id}
      aria-labelledby="contato-heading"
      className="relative z-10 bg-[var(--color-pb-white)] px-6 py-6"
    >
      <div ref={revealRef} className="reveal-section @container mx-auto max-w-7xl">
        {/* Two columns only once the form column fits its side-by-side rows (see .contact-form-row);
            narrower than that it stacks instead of squeezing the form. */}
        <div className="grid gap-12 @min-[70rem]:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] @min-[70rem]:items-stretch @min-[70rem]:gap-16">
          <div className="flex flex-col">
            <span className="section-kicker-light">{copy.kicker}</span>
            <h2 id="contato-heading" className="mt-6 font-[var(--font-display)] text-3xl font-bold leading-[1.08] tracking-tight text-[var(--color-pb-accent-blue)] sm:text-4xl md:text-5xl">
              {copy.headline.before} {copy.headline.accent}
            </h2>
            <p className="mt-6 mb-10 max-w-xl text-base leading-relaxed text-[var(--color-pb-ink-2)] sm:text-lg">
              {copy.subheadline}
            </p>

            <div id={lgpdNoteId} className="lgpd-note mt-auto">
              <div className="flex items-center gap-2 text-[var(--color-pb-ink)]">
                <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="font-[var(--font-display)] text-sm font-semibold">
                  {copy.lgpd.title}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--color-pb-ink-2)]">
                {copy.lgpd.bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-[9px] h-[4px] w-[4px] flex-shrink-0 rounded-full bg-[var(--color-pb-accent-on-light)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[var(--color-pb-ink-2)]">
                {copy.lgpd.dpoLabel}{' '}
                <a
                  href={`mailto:${siteData.contact.email}`}
                  className="text-[var(--color-pb-accent-on-light)] hover:underline"
                >
                  {siteData.contact.email}
                </a>
              </p>
            </div>
          </div>

          <form
            ref={formRef}
            noValidate
            className="contact-form"
            onSubmit={handleSubmit}
            aria-describedby={lgpdNoteId}
          >
            <div className="contact-form-row">
              <Field
                label={copy.fields.name.label}
                placeholder={copy.fields.name.placeholder}
                requiredLabel={copy.fields.name.required}
                value={form.name}
                onChange={updateField('name')}
                autoComplete="name"
                maxLength={FIELD_LIMITS.name}
                error={showErrors ? validationErrors.name : null}
              />
              <Field
                label={copy.fields.company.label}
                placeholder={copy.fields.company.placeholder}
                value={form.company}
                onChange={updateField('company')}
                autoComplete="organization"
                maxLength={FIELD_LIMITS.company}
              />
            </div>

            <Field
              label={copy.fields.contact.label}
              placeholder={copy.fields.contact.placeholder}
              requiredLabel={copy.fields.contact.required}
              value={form.contact}
              onChange={updateField('contact')}
              autoComplete="email"
              inputMode="text"
              maxLength={FIELD_LIMITS.contact}
              error={showErrors ? validationErrors.contact : null}
            />

            <Field
              label={copy.fields.message.label}
              placeholder={copy.fields.message.placeholder}
              requiredLabel={copy.fields.message.required}
              value={form.message}
              onChange={updateField('message')}
              as="textarea"
              rows={5}
              maxLength={FIELD_LIMITS.message}
              hint={`${form.message.length}/${FIELD_LIMITS.message}`}
              error={showErrors ? validationErrors.message : null}
            />

            <label htmlFor={consentId} className="contact-consent">
              <input
                id={consentId}
                type="checkbox"
                checked={form.consent}
                onChange={updateField('consent')}
                required
                aria-required="true"
                aria-invalid={showErrors && validationErrors.consent ? 'true' : undefined}
                aria-describedby={showErrors && validationErrors.consent ? `${consentId}-error` : undefined}
              />
              <span>
                {copy.consent.label}
                {showErrors && validationErrors.consent && (
                  <span id={`${consentId}-error`} className="contact-consent-error"> {validationErrors.consent}</span>
                )}
              </span>
            </label>

            <div className="contact-actions">
              <button type="submit" className="contact-submit-primary group">
                <WhatsAppIcon className="h-5 w-5" />
                <span>{copy.submit}</span>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
              <button
                type="button"
                onClick={() => deliver('email')}
                className="contact-submit-secondary"
              >
                <Mail size={18} strokeWidth={1.5} aria-hidden="true" />
                {copy.submitSecondary}
              </button>
            </div>

            <StatusMessage status={status} copy={copy} />
          </form>
        </div>
      </div>
    </section>
  );
}

function StatusMessage({ status, copy }) {
  if (status === 'invalid') {
    return (
      <p role="alert" className="contact-warning">
        Confira os campos destacados e aceite o compartilhamento dos dados para continuar.
      </p>
    );
  }
  if (status === 'sent-whatsapp') {
    return (
      <p role="status" className="contact-success">
        {copy.successWhatsApp}
      </p>
    );
  }
  if (status === 'sent-email') {
    return (
      <p role="status" className="contact-success">
        {copy.successEmail}
      </p>
    );
  }
  if (status === 'blocked') {
    return (
      <p role="status" className="contact-warning">
        O navegador bloqueou a nova janela. Libere o popup ou use o botão de e-mail.
      </p>
    );
  }
  if (status === 'too-long') {
    return (
      <p role="status" className="contact-warning">
        Mensagem grande demais para envio por link. Encurte o texto ou envie por e-mail.
      </p>
    );
  }
  return null;
}

function Field({
  label,
  requiredLabel = false,
  as = 'input',
  error = null,
  hint = null,
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const Component = as;
  return (
    <label htmlFor={id} className="contact-field">
      <span className="contact-field-label">
        {label}
        {requiredLabel && <span aria-hidden="true"> *</span>}
      </span>
      <Component
        id={id}
        required={requiredLabel}
        aria-required={requiredLabel ? 'true' : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <span id={errorId} className="contact-field-error">
          {error}
        </span>
      )}
      {!error && hint && <span className="contact-field-hint">{hint}</span>}
    </label>
  );
}
