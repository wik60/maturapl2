import { type ReactNode, useState } from 'react';
import { speakWord } from '../audio/speech';
import { APP_NAME } from '../config';
import { ACHIEVEMENTS } from '../game/achievements';
import { COSMETICS, levelProgress } from '../game/rewards';
import { currentStreak } from '../game/streak';
import { Link, useRoute } from '../router/router';
import { buyCosmetic, clearHistory, today } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { useSyncView } from '../sync/useSync';
import { Icon } from '../ui/components/Icon';
import { Dialog, plural, Progress } from '../ui/components/ui';
import { AccountSection } from '../ui/components/Account';
import { InstallCard, isStandalone } from '../ui/components/InstallPrompt';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';

const ZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Dublin', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'Australia/Sydney'];

type Sub = 'konto' | 'ustawienia' | 'sklep' | 'aplikacja';
const TITLES: Record<Sub, string> = { konto: 'Konto', ustawienia: 'Ustawienia', sklep: 'Kolor długopisu', aplikacja: 'Ekran początkowy' };

function Row({ to, icon, label, sub, tone, onClick }: { to?: string; icon: string; label: string; sub?: ReactNode; tone?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="li-icon" style={tone ? ({ '--tone': tone } as Record<string, string>) : undefined}><Icon name={icon} size={20} /></span>
      <span className="li-text"><strong>{label}</strong>{sub && <small>{sub}</small>}</span>
      <span className="li-chev" aria-hidden="true"><Icon name="chevron" size={18} /></span>
    </>
  );
  return to ? <Link to={to} className="li">{body}</Link> : <button type="button" className="li" onClick={onClick}>{body}</button>;
}

function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="li setting-li">
      <span className="li-text"><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      <input type="checkbox" className="switch" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function Profile() {
  const r = useRoute();
  const sub = r.query.get('s') as Sub | null;
  if (sub && TITLES[sub]) return <SubPage sub={sub} />;
  return <ProfileHome />;
}

function ProfileHome() {
  const state = useAppState();
  const store = useStore();
  const sv = useSyncView();
  const t = today(state, store.now());
  const lp = levelProgress(state.xp);
  const streak = currentStreak(state.days, t);
  const badges = Object.keys(state.achievements).length;
  const name = state.settings.name.trim();
  const ink = COSMETICS.find((c) => c.id === state.settings.theme);
  const installed = isStandalone();

  return (
    <div className="profile">
      <section className="card player" aria-label="Twój profil">
        <div className="player-top">
          <span className="avatar" aria-hidden="true" style={ink ? ({ '--av': ink.color } as Record<string, string>) : undefined}>{name ? name.charAt(0).toUpperCase() : <Icon name="me" size={30} />}</span>
          <div className="player-id">
            <h1>{name || 'Twój profil'}</h1>
            <span className="small muted">Poziom {lp.level} · {state.xp} XP</span>
            <Progress value={lp.ratio} label={`Postęp do poziomu ${lp.level + 1}`} tone="marker" />
          </div>
        </div>
        <div className="player-stats">
          <div><b className="flame-c"><Icon name="flame" size={18} />{streak}</b><span>{plural(streak, 'dzień', 'dni', 'dni')} serii</span></div>
          <div><b><Icon name="badge" size={18} />{badges}/{ACHIEVEMENTS.length}</b><span>odznaki</span></div>
          <div><b className="coin-c"><Icon name="coin" size={18} />{state.coins}</b><span>monety</span></div>
        </div>
      </section>

      <nav className="tiles" aria-label="Nauka">
        <Link to="/progress" className="card tile"><span className="ti"><Icon name="grid" /></span><strong>Postępy</strong></Link>
        <Link to="/mistakes" className="card tile"><span className="ti"><Icon name="list" /></span><strong>Błędy</strong></Link>
        <Link to="/vocab" className="card tile"><span className="ti"><Icon name="book" /></span><strong>Słówka</strong></Link>
        <Link to="/diagnostic" className="card tile"><span className="ti"><Icon name="practice" /></span><strong>Diagnoza</strong></Link>
      </nav>

      <nav className="card list" aria-label="Konto i ustawienia">
        <Row to="/profile?s=konto" icon="cloud" label="Konto i synchronizacja" tone="#1b78b0" sub={sv.email ? `${sv.email}` : 'Zapis postępu w chmurze'} />
        <Row to="/profile?s=ustawienia" icon="settings" label="Ustawienia" tone="#5d6680" sub="Cel dzienny, dźwięk, nagrania, tekst" />
        <Row to="/profile?s=sklep" icon="pen" label="Kolor długopisu" tone={ink?.color ?? '#2a45d6'} sub={`${state.coins} ${plural(state.coins, 'moneta', 'monety', 'monet')} do wydania`} />
        <Row to="/profile?s=aplikacja" icon="phone" label="Ekran początkowy" tone="#1c9454" sub={installed ? 'Gra jest zainstalowana' : 'Dodaj grę jak aplikację'} />
        <Row to="/about" icon="info" label="O aplikacji" tone="#7440cf" sub="Źródła, zgodność z CKE, ograniczenia" />
      </nav>
      <p className="small muted" style={{ textAlign: 'center', margin: 0 }}>{APP_NAME} · wersja treści 1</p>
    </div>
  );
}

function SubPage({ sub }: { sub: Sub }) {
  return (
    <div>
      <div className="backrow">
        <Link to="/profile" className="btn quiet icon sm" aria-label="Wróć do profilu"><Icon name="back" size={20} /></Link>
        <h1>{TITLES[sub]}</h1>
      </div>
      {sub === 'konto' && <section className="card"><AccountSection bare /></section>}
      {sub === 'ustawienia' && <Settings />}
      {sub === 'sklep' && <Shop />}
      {sub === 'aplikacja' && <InstallCard place="profile" />}
    </div>
  );
}

function Settings() {
  const state = useAppState();
  const store = useStore();
  const sv = useSyncView();
  const avail = useAudioAvailability();
  const [reset, setReset] = useState(false);
  const st = state.settings;
  const set = (patch: Partial<typeof st>) => store.update((s) => { s.settings = { ...s.settings, ...patch }; });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'matura-quest-postep.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="stack">
      <section className="card list" aria-label="Nauka">
        <label className="li setting-li">
          <span className="li-text"><strong>Imię</strong><small>Do powitania na starcie</small></span>
          <input className="input li-input" value={st.name} placeholder="Twoje imię" onChange={(e) => set({ name: e.target.value.slice(0, 24) })} />
        </label>
        <div className="li setting-li">
          <span className="li-text"><strong>Cel dzienny</strong><small>Pytań dziennie</small></span>
          <div className="seg" role="radiogroup" aria-label="Cel dzienny">
            {[10, 20, 30, 50].map((n) => <button key={n} type="button" role="radio" aria-checked={st.dailyGoalItems === n} onClick={() => set({ dailyGoalItems: n })}>{n}</button>)}
          </div>
        </div>
        <label className="li setting-li">
          <span className="li-text"><strong>Strefa czasowa</strong><small>Od niej zależy liczenie serii</small></span>
          <select className="input li-input" value={st.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
            {ZONES.map((z) => <option key={z} value={z}>{z.split('/')[1].replace('_', ' ')}</option>)}
          </select>
        </label>
      </section>

      <section className="card list" aria-label="Dźwięk i nagrania">
        <Switch label="Dźwięki" hint="Sygnał po odpowiedzi i nagrodzie" checked={st.sound} onChange={(v) => set({ sound: v })} />
        <div className="li setting-li" style={{ flexWrap: 'wrap' }}>
          <span className="li-text"><strong>Tempo nagrań</strong><small>{st.speechRate.toFixed(2)}×</small></span>
          <input className="range" type="range" min={0.7} max={1.1} step={0.05} value={st.speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} aria-label="Tempo nagrań" />
        </div>
        <div className="li setting-li">
          <span className="li-text"><strong>Test głosu</strong><small>{avail === 'ready' ? 'Synteza mowy dostępna (zapasowa, gdy brak nagrania)' : avail === 'checking' ? 'Sprawdzam…' : 'Brak syntezy mowy – działają tylko nagrania'}</small></span>
          <button className="btn quiet sm" disabled={avail !== 'ready'} onClick={() => speakWord('This is how the listening tasks will sound.', st.speechRate)}>Odtwórz</button>
        </div>
      </section>

      <section className="card list" aria-label="Wygląd">
        <Switch label="Ograniczone animacje" hint="Mniej ruchu na ekranie" checked={st.motion === 'reduced'} onChange={(v) => set({ motion: v ? 'reduced' : 'system' })} />
        <Switch label="Większy tekst" checked={st.textSize === 'large'} onChange={(v) => set({ textSize: v ? 'large' : 'normal' })} />
      </section>

      <section className="card list" aria-label="Dane">
        <div className="li setting-li">
          <span className="li-text"><strong>Zapis postępu</strong><small>{store.persisted() ? 'Na tym urządzeniu' : 'Tylko do zamknięcia karty – przeglądarka blokuje zapis'}{sv.email ? ' i w chmurze' : ''}</small></span>
        </div>
        {window.top === window.self && <Row icon="list" label="Pobierz kopię postępu" sub="Plik .json" tone="#1b78b0" onClick={exportData} />}
        <Row icon="trash" label="Wyczyść cały postęp" sub="Tego nie da się cofnąć" tone="#db3b54" onClick={() => setReset(true)} />
      </section>
      <p className="small muted" style={{ margin: 0 }}>Przypomnienia o nauce nie są dostępne w tej wersji (wymagają serwera powiadomień).</p>

      <Dialog open={reset} onClose={() => setReset(false)} title="Wyczyścić cały postęp?" actions={<>
        <button className="btn quiet" onClick={() => setReset(false)}>Anuluj</button>
        <button className="btn danger" onClick={() => { store.update((s, n) => clearHistory(s, 'all', n), { replace: true }); setReset(false); }}>Wyczyść wszystko</button>
      </>}>
        <p>Usuniemy XP, monety, historię odpowiedzi, zeszyt błędów, postęp mapy i wypowiedzi. Ustawienia zostaną.</p>
      </Dialog>
    </div>
  );
}

function Shop() {
  const state = useAppState();
  const store = useStore();
  const st = state.settings;
  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>Monety wydajesz tylko na wygląd – cała nauka jest za darmo. Masz <strong>{state.coins}</strong> {plural(state.coins, 'monetę', 'monety', 'monet')}.</p>
      <div className="shop">
        {COSMETICS.map((c) => {
          const owned = state.purchases.includes(c.id) || c.price === 0;
          const active = st.theme === c.id || (!st.theme && c.id === 'ink-blue');
          return (
            <div className={`card shop-item ${active ? 'active' : ''}`} key={c.id} style={{ '--sw': c.color } as Record<string, string>}>
              <span className="pen-swatch" aria-hidden="true"><Icon name="pen" size={26} /></span>
              <strong>{c.namePl}</strong>
              {owned
                ? <button className="btn sm quiet" disabled={active} onClick={() => store.update((s) => { s.settings = { ...s.settings, theme: c.id }; })}>{active ? 'Używasz' : 'Użyj'}</button>
                : <button className="btn sm" disabled={state.coins < c.price} onClick={() => store.update((s) => buyCosmetic(s, c.id, c.price))}><Icon name="coin" size={16} />{c.price}</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
