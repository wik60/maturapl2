import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { APP_NAME } from './config';
import { COSMETICS, levelFromXp } from './game/rewards';
import { currentStreak } from './game/streak';
import { Link, useRoute } from './router/router';
import { today } from './store/actions';
import { useAppState, useStore } from './store/useStore';
import { Icon, Mark } from './ui/components/Icon';
import { setToastSound, ToastHost, useOnline } from './ui/components/ui';
import { ConflictDialog } from './ui/components/Account';
import { useSyncView } from './sync/useSync';
import { Home } from './pages/Home';

const MapPage = lazy(() => import('./pages/MapPage'));
const Practice = lazy(() => import('./pages/Practice'));
const SessionPage = lazy(() => import('./pages/Session'));
const ExamHub = lazy(() => import('./pages/ExamHub'));
const ExamRun = lazy(() => import('./pages/ExamRun'));
const ExamResults = lazy(() => import('./pages/ExamResults'));
const Mistakes = lazy(() => import('./pages/Mistakes'));
const ProgressPage = lazy(() => import('./pages/Progress'));
const Vocab = lazy(() => import('./pages/Vocab'));
const WritingList = lazy(() => import('./pages/WritingList'));
const WritingTask = lazy(() => import('./pages/WritingTask'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));

class Boundary extends Component<{ children?: ReactNode }, { error?: Error }> {
  constructor(p: { children?: ReactNode }) {
    super(p);
    this.state = {};
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card" role="alert">
          <h1>Coś poszło nie tak</h1>
          <p>Ten ekran się nie wczytał. Twój postęp jest zapisany. Jeśli jesteś offline, część ekranów może wymagać ponownego połączenia przy pierwszym otwarciu.</p>
          <p className="small muted">{String(this.state.error.message)}</p>
          <button className="btn" onClick={() => { this.setState({ error: undefined }); location.hash = '/'; }}>Wróć na start</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Page() {
  const r = useRoute();
  const [a, b, c] = r.segments;
  switch (a) {
    case undefined: return <Home />;
    case 'map': return <MapPage />;
    case 'practice': return <Practice />;
    case 'session': return <SessionPage id={b} />;
    case 'exam':
      if (!b) return <ExamHub />;
      return c === 'results' ? <ExamResults id={b} /> : <ExamRun id={b} />;
    case 'mistakes': return <Mistakes />;
    case 'progress': return <ProgressPage />;
    case 'vocab': return <Vocab />;
    case 'writing': return b ? <WritingTask id={b} /> : <WritingList />;
    case 'diagnostic': return <Diagnostic />;
    case 'profile': return <Profile />;
    case 'about': return <About />;
    default:
      return (
        <div className="card empty">
          <h1>Nie ma takiej strony</h1>
          <p>Ten adres nie prowadzi do żadnego ekranu gry.</p>
          <Link className="btn" to="/">Wróć na start</Link>
        </div>
      );
  }
}

const NAV = [
  { to: '/', label: 'Start', icon: 'home', match: (s?: string) => !s },
  { to: '/map', label: 'Mapa', icon: 'map', match: (s?: string) => s === 'map' },
  { to: '/practice', label: 'Ćwicz', icon: 'practice', match: (s?: string) => ['practice', 'session', 'writing', 'vocab', 'mistakes', 'diagnostic'].includes(s ?? '') },
  { to: '/exam', label: 'Arkusz', icon: 'exam', match: (s?: string) => s === 'exam' },
  { to: '/profile', label: 'Ja', icon: 'me', match: (s?: string) => ['profile', 'progress', 'about'].includes(s ?? '') },
];

export function App() {
  const state = useAppState();
  const store = useStore();
  const r = useRoute();
  const online = useOnline();
  const sv = useSyncView();
  const t = today(state, store.now());
  const streak = currentStreak(state.days, t);
  const ink = COSMETICS.find((c) => c.id === state.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.text = state.settings.textSize;
    root.dataset.motion = state.settings.motion;
    if (ink && ink.id !== 'ink-blue') root.style.setProperty('--ink', ink.color);
    else root.style.removeProperty('--ink');
    setToastSound(state.settings.sound);
  }, [state.settings.textSize, state.settings.motion, state.settings.sound, ink]);

  const examFocus = !!(r.segments[0] === 'exam' && r.segments[1] && r.segments[2] !== 'results');
  const lessonMode = r.segments[0] === 'session';
  const focusMode = examFocus || lessonMode;
  const screenKey = r.segments.slice(0, 2).join('/');

  return (
    <div className={`app ${examFocus ? 'focus' : ''} ${lessonMode ? 'lesson-mode' : ''}`}>
      <a href="#main" className="sr-only" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Przejdź do treści</a>
      {!online && <div className="offline" role="status">Jesteś offline. Zapisane ćwiczenia działają, a postęp zapisuje się na tym urządzeniu.</div>}
      {!focusMode && (
        <header className="topbar">
          <Link to="/" className="brand" aria-label={`${APP_NAME} – start`}><Mark />{APP_NAME}</Link>
          <span className="spacer" />
          <span className={`chip flame ${streak ? '' : 'cold'}`} title="Seria dni nauki"><Icon name="flame" size={18} />{streak}<span className="sr-only"> dni serii</span></span>
          {sv.email && (
            <Link to="/profile" className={`chip ${sv.status === 'error' || sv.status === 'conflict' ? 'bad' : ''}`} aria-label={`Synchronizacja: ${sv.status === 'synced' ? 'zsynchronizowano' : sv.status}`}>
              <Icon name="cloud" size={16} />{sv.status === 'synced' ? '' : sv.status === 'syncing' || sv.status === 'pending' ? '…' : '!'}
            </Link>
          )}
          <span className="chip marker" title="Poziom gracza">Poz. {levelFromXp(state.xp)}</span>
        </header>
      )}
      <main id="main" tabIndex={-1} className={r.segments[0] === 'about' ? 'wide' : ''}>
        {store.loadMessage && r.segments.length === 0 && <div className="notice" role="status" style={{ margin: '0.5rem 0 0.8rem' }}>{store.loadMessage}</div>}
        <Boundary>
          <Suspense fallback={<p className="loading" role="status">Wczytywanie…</p>}>
            <div className={lessonMode ? undefined : "screen"} key={screenKey}><Page /></div>
          </Suspense>
        </Boundary>
      </main>
      {!focusMode && (
        <nav className="bottomnav" aria-label="Nawigacja główna">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} aria-current={n.match(r.segments[0]) ? 'page' : undefined}>
              <span className="navicon"><Icon name={n.icon} /></span>
              {n.label}
            </Link>
          ))}
        </nav>
      )}
      <ToastHost />
      <ConflictDialog />
    </div>
  );
}
