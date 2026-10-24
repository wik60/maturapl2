import { useState } from 'react';
import { speakWord } from '../audio/speech';
import { APP_NAME } from '../config';
import { COSMETICS } from '../game/rewards';
import { Link } from '../router/router';
import { buyCosmetic, clearHistory } from '../store/actions';
import { useAppState, useStore } from '../store/useStore';
import { useSyncView } from '../sync/useSync';
import { Dialog } from '../ui/components/ui';
import { AccountSection } from '../ui/components/Account';
import { useAudioAvailability } from '../ui/exercises/AudioPlayer';

const ZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Dublin', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'Australia/Sydney'];

export default function Profile() {
  const state = useAppState();
  const store = useStore();
  const [reset, setReset] = useState(false);
  const avail = useAudioAvailability();
  const sv = useSyncView();
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
      <h1>Twój profil</h1>
      <nav className="tiles" aria-label="Skróty">
        <Link to="/progress" className="card tile"><strong>Postępy</strong><span>Umiejętności, gotowość, odznaki</span></Link>
        <Link to="/mistakes" className="card tile"><strong>Zeszyt błędów</strong><span>Powtórki pomyłek</span></Link>
        <Link to="/vocab" className="card tile"><strong>Słówka</strong><span>Fiszki</span></Link>
        <Link to="/diagnostic" className="card tile"><strong>Diagnoza</strong><span>Sprawdź poziom startowy</span></Link>
        <Link to="/about" className="card tile"><strong>O aplikacji</strong><span>Źródła, zgodność z CKE, ograniczenia</span></Link>
      </nav>

      <AccountSection />
      <section className="card">
        <h2>Zapis na urządzeniu</h2>
        <p style={{ marginTop: 0 }}>Postęp zapisuje się {store.persisted() ? <strong>na tym urządzeniu, w tej przeglądarce</strong> : <strong>tylko do zamknięcia karty (przeglądarka blokuje zapis)</strong>}{sv.email ? ' i w chmurze na Twoim koncie.' : '.'}</p>
        {window.top === window.self && <button className="btn quiet sm" onClick={exportData}>Pobierz kopię postępu (.json)</button>}
      </section>

      <section className="card">
        <h2>Ustawienia</h2>
        <label className="setting"><span>Imię (do powitania)</span><input className="input" style={{ maxWidth: 180 }} value={st.name} onChange={(e) => set({ name: e.target.value.slice(0, 24) })} /></label>
        <label className="setting"><span>Cel dzienny (pytania)</span>
          <select className="input" value={st.dailyGoalItems} onChange={(e) => set({ dailyGoalItems: Number(e.target.value) })}>
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="setting"><span>Strefa czasowa (liczenie serii)</span>
          <select className="input" value={st.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <label className="setting"><span>Dźwięki</span><input type="checkbox" checked={st.sound} onChange={(e) => set({ sound: e.target.checked })} /></label>
        <label className="setting"><span>Ograniczone animacje</span><input type="checkbox" checked={st.motion === 'reduced'} onChange={(e) => set({ motion: e.target.checked ? 'reduced' : 'system' })} /></label>
        <label className="setting"><span>Większy tekst</span><input type="checkbox" checked={st.textSize === 'large'} onChange={(e) => set({ textSize: e.target.checked ? 'large' : 'normal' })} /></label>
        <label className="setting"><span>Tempo nagrań: {st.speechRate.toFixed(2)}×</span>
          <input type="range" min={0.7} max={1.1} step={0.05} value={st.speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} aria-label="Tempo nagrań" />
        </label>
        <div className="row" style={{ marginTop: '0.6rem' }}>
          <button className="btn quiet sm" disabled={avail !== 'ready'} onClick={() => speakWord('This is how the listening tasks will sound.', st.speechRate)}>Test głosu</button>
          <span className="small muted">{avail === 'ready' ? 'Synteza mowy dostępna.' : avail === 'checking' ? 'Sprawdzam…' : 'Brak angielskiego głosu w tej przeglądarce – nagrania nie zadziałają.'}</span>
        </div>
        <p className="small muted">Powiadomienia przypominające o nauce nie są dostępne w tej wersji (wymagają serwera powiadomień).</p>
      </section>

      <section className="card">
        <h2>Kolor długopisu</h2>
        <p className="small muted" style={{ marginTop: 0 }}>Monety wydajesz tylko na wygląd – cała nauka jest dostępna za darmo. Masz {state.coins} monet.</p>
        {COSMETICS.map((c) => {
          const owned = state.purchases.includes(c.id);
          const active = st.theme === c.id;
          return (
            <div className="setting" key={c.id}>
              <span><span className="swatch" style={{ background: c.color }} /> {c.namePl}</span>
              {owned
                ? <button className="btn sm quiet" disabled={active} onClick={() => set({ theme: c.id })}>{active ? 'Używasz' : 'Użyj'}</button>
                : <button className="btn sm" disabled={state.coins < c.price} onClick={() => store.update((s) => buyCosmetic(s, c.id, c.price))}>Kup za {c.price}</button>}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Dane</h2>
        <button className="btn danger sm" onClick={() => setReset(true)}>Wyczyść cały postęp</button>
      </section>
      <p className="small muted">{APP_NAME} · wersja treści 1</p>

      <Dialog open={reset} onClose={() => setReset(false)} title="Wyczyścić cały postęp?" actions={<>
        <button className="btn quiet" onClick={() => setReset(false)}>Anuluj</button>
        <button className="btn danger" onClick={() => { store.update((s, n) => clearHistory(s, 'all', n), { replace: true }); setReset(false); }}>Wyczyść wszystko</button>
      </>}>
        <p>Usuniemy XP, monety, historię odpowiedzi, zeszyt błędów, postęp mapy i wypowiedzi. Ustawienia zostaną. Tego nie da się cofnąć.</p>
      </Dialog>
    </div>
  );
}
