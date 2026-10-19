import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Candle } from './components/Candle';
import { I18nContext, initialLang, LANGS, MESSAGES, rememberLang, useI18n, type Lang } from './i18n';
import { onConfirm, onToast, type ConfirmRequest } from './lib/feedback';
import { href, useRoute, type Route } from './lib/router';
import { About } from './pages/About';
import { Edit } from './pages/Edit';
import { Home } from './pages/Home';
import { Memorial } from './pages/Memorial';
import { NotFound } from './pages/NotFound';

function Header({ route }: { route: Route }) {
  const { t } = useI18n();
  const current = (name: Route['name']) => (route.name === name ? 'page' : undefined);
  return (
    <header class="site-header">
      <div class="site-header-inner">
        <a href={href('/')} class="wordmark">
          <Candle lit class="wordmark-candle" />
          <span class="wordmark-text">
            <span class="wordmark-name">{t.site.name}</span>
            <span class="wordmark-family">{t.site.family}</span>
          </span>
        </a>
        <nav aria-label={t.site.menu}>
          <ul class="site-nav">
            <li>
              <a href={href('/')} aria-current={current('home')}>
                {t.site.everyone}
              </a>
            </li>
            <li>
              <a href={href('/about')} aria-current={current('about')}>
                {t.site.about}
              </a>
            </li>
            <li>
              <a href={href('/new')} class="nav-add" aria-current={current('new')}>
                <span aria-hidden="true">+ </span>
                {t.site.add}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t, lang, setLang } = useI18n();
  return (
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          <p class="footer-name">
            {t.site.name} <span class="muted">· {t.site.family}</span>
          </p>
          <p class="footer-note">
            {t.site.private} {t.site.noTracking}
          </p>
        </div>
        <nav aria-label={t.site.language} class="language-strip">
          <ul>
            {LANGS.map((l) => (
              <li key={l.code}>
                {l.code === lang ? (
                  <span aria-current="true" lang={l.code}>
                    {l.name}
                  </span>
                ) : (
                  <button type="button" class="link-button" lang={l.code} onClick={() => setLang(l.code)}>
                    {l.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function Toaster() {
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error'; id: number } | null>(null);
  useEffect(
    () =>
      onToast((text, tone) => {
        const id = Date.now();
        setMessage({ text, tone, id });
        setTimeout(() => setMessage((m) => (m?.id === id ? null : m)), tone === 'error' ? 7000 : 3800);
      }),
    [],
  );
  return (
    <div class="toaster" role="status" aria-live="polite">
      {message && (
        <p key={message.id} class={`toast ${message.tone === 'error' ? 'toast-error' : ''}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function ConfirmHost() {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [request, setRequest] = useState<(ConfirmRequest & { answer: (yes: boolean) => void }) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(
    () =>
      onConfirm((req, answer) => {
        returnFocus.current = document.activeElement as HTMLElement | null;
        setRequest({ ...req, answer });
      }),
    [],
  );
  useEffect(() => {
    if (request && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [request]);

  const finish = (yes: boolean) => {
    request?.answer(yes);
    setRequest(null);
    dialog.current?.close();
    returnFocus.current?.focus?.();
  };

  return (
    <dialog ref={dialog} class="confirm" aria-labelledby="confirm-title" aria-describedby={request?.text ? 'confirm-text' : undefined} onCancel={() => finish(false)}>
      {request && (
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            finish(true);
          }}
        >
          <h2 id="confirm-title">{request.title}</h2>
          {request.text && <p id="confirm-text">{request.text}</p>}
          <div class="form-actions">
            <button type="submit" class={`button ${request.danger ? 'button-danger' : ''}`}>
              {request.confirm}
            </button>
            <button type="button" class="button button-quiet" onClick={() => finish(false)} autofocus>
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home query={route.query} />;
    case 'person':
      return <Memorial slug={route.slug} />;
    case 'edit':
      return <Edit key={`edit-${route.slug}`} slug={route.slug} />;
    case 'new':
      return <Edit key="new" slug={null} />;
    case 'about':
      return <About />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const i18n = useMemo(
    () => ({
      lang,
      t: MESSAGES[lang],
      setLang: (next: Lang) => {
        rememberLang(next);
        setLangState(next);
      },
    }),
    [lang],
  );
  const { route, key } = useRoute();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // A new page: start at the top, give it its title, and move the keyboard focus to its heading.
  useEffect(() => {
    if (route.name === 'home' || route.name === 'notFound') document.title = MESSAGES[lang].site.name;
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const focusHeading = () => {
      // Not when the visitor has already moved on to a field or button on the new page.
      const active = document.activeElement;
      if (active && active !== document.body && active !== main.current && main.current?.contains(active)) return;
      main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    };
    // Pages load their data first; wait a moment for the heading to be there.
    requestAnimationFrame(() => setTimeout(focusHeading, 60));
  }, [key]);

  return (
    <I18nContext.Provider value={i18n}>
      <a class="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        main.current?.focus();
      }}>
        {i18n.t.site.skip}
      </a>
      <Header route={route} />
      <main id="main" ref={main} tabIndex={-1} class="site-main">
        <Page route={route} />
      </main>
      <Footer />
      <Toaster />
      <ConfirmHost />
    </I18nContext.Provider>
  );
}
