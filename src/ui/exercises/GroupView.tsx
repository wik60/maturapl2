import { useId, type ReactNode } from 'react';
import { getGroup } from '../../content';
import { FORMATS } from '../../content/formats';
import type { Item, OpenItem, Option, TaskGroup } from '../../content/types';
import { correctAnswerText, type ItemResult } from '../../engine/validate';
import { Icon } from '../components/Icon';
import { AudioPlayer } from './AudioPlayer';

export interface AudioPolicy {
  rate: number;
  maxPlays?: number;
  plays?: Record<string, number>;
  onPlay?: (clipId: string) => void;
}

interface Props {
  group: TaskGroup;
  answers: Record<string, string>;
  onAnswer: (itemId: string, value: string) => void;
  results?: ItemResult[];
  audio: AudioPolicy;
  showTranscript?: boolean;
  /** Exam mode hides official-format badges' extra info and never shows feedback. */
  examMode?: boolean;
}

/** Original 1-based position of an item inside its full group (for gap numbers). */
export function fullGroup(g: TaskGroup) {
  return getGroup(g.id) ?? g;
}

export function optionText(opts: Option[], id: string) {
  return opts.find((o) => o.id === id)?.text ?? '';
}

export function GapText({ body, group, answers, current }: { body: string; group: TaskGroup; answers: Record<string, string>; current?: string }) {
  const full = fullGroup(group);
  const inView = new Set(group.items.map((i) => i.id));
  const parts = body.split(/(\[\[\d+\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[\[(\d+)\]\]$/);
        if (!m) return <span key={i}>{p}</span>;
        const n = Number(m[1]);
        const item = full.items[n - 1];
        if (!item) return <span key={i}>({n}) ____</span>;
        if (!inView.has(item.id)) {
          // gap answered elsewhere – show the key so the text reads naturally
          const txt = item.kind === 'open' ? item.accepted[0].replace(/[()]/g, '') : item.kind === 'mc' ? optionText(item.options, item.answer) : item.answer;
          return <span key={i} className="gapmark filled" aria-label={`luka ${n}: ${txt}`}>{txt}</span>;
        }
        const a = answers[item.id];
        const shown = !a ? '' : item.kind === 'mc' ? optionText(item.options, a) : item.kind === 'match' ? a : a;
        return (
          <span key={i} className={`gapmark ${a ? 'filled' : ''} ${current === item.id ? 'current' : ''}`} data-gap={item.id} aria-label={`luka ${n}${a ? `: ${shown}` : ''}`}>
            <small>{n}</small>
            {shown || '      '}
          </span>
        );
      })}
    </>
  );
}

function Stimulus({ group, answers, audio, showTranscript, examMode }: Props) {
  const st = group.stimulus;
  if (st.kind === 'text') {
    return (
      <div className="card" lang="en">
        {st.title && <div className="passage-title">{st.title}</div>}
        <div className="passage"><GapText body={st.body} group={group} answers={answers} /></div>
        {st.source && <p className="small muted" lang="pl" style={{ marginTop: '0.5rem' }}>{st.source}</p>}
      </div>
    );
  }
  if (st.kind === 'texts') {
    return (
      <div className="texts" lang="en">
        {st.texts.map((t) => (
          <div className="text-card" key={t.label}>
            <div style={{ marginBottom: '0.3rem' }}>
              <span className="label">{t.label}</span>
              {t.title && <strong>{t.title}</strong>}
            </div>
            <div className="passage"><GapText body={t.body} group={group} answers={answers} /></div>
          </div>
        ))}
      </div>
    );
  }
  if (st.kind === 'audio' && st.clips.length) {
    return (
      <div className="stack">
        {st.clips.map((c) => (
          <AudioPlayer key={c.id} clip={c} rate={audio.rate} maxPlays={audio.maxPlays} plays={audio.plays?.[c.id]} onPlayed={() => audio.onPlay?.(c.id)} showTranscript={showTranscript && !examMode} compact={examMode} />
        ))}
      </div>
    );
  }
  return null;
}

function Feedback({ group, item, result }: { group: TaskGroup; item: Item; result?: ItemResult }) {
  if (!result) return null;
  if (result.verdict === 'invalid') {
    return <div className="feedback bad" role="status">To zadanie ma błędny klucz i nie zostało ocenione.</div>;
  }
  const ok = result.verdict === 'correct';
  const note = !ok && result.given && item.distractorNotes?.[result.given];
  return (
    <div className={`feedback ${ok ? 'good' : 'bad'}`} role="status">
      <div className="verdict">
        <Icon name={ok ? 'check' : 'cross'} size={20} />
        {ok ? 'Dobrze!' : result.verdict === 'unanswered' ? 'Brak odpowiedzi.' : 'Niestety, źle.'}
      </div>
      {!ok && <div>Poprawna odpowiedź: <strong lang="en">{correctAnswerText(group, item)}</strong></div>}
      {result.reasonPl && <div>{result.reasonPl}</div>}
      <div style={{ marginTop: '0.3rem' }}>{item.explanationPl}</div>
      {note && <div style={{ marginTop: '0.3rem' }}>Dlaczego nie {result.given}? {note}</div>}
      {item.evidence && <div className="evidence" lang="en">Klucz w {FORMATS[group.format].section === 'listening' ? 'nagraniu' : 'tekście'}: „{item.evidence}”</div>}
      {item.rule && <div className="rule">Reguła: {item.rule}</div>}
    </div>
  );
}

export function McInput({ item, value, onChange, result, name }: { item: Item & { kind: 'mc' }; value: string; onChange: (v: string) => void; result?: ItemResult; name: string }) {
  const checked = !!result;
  return (
    <div className="options" role="radiogroup" aria-labelledby={`${name}-q`}>
      {item.options.map((o) => {
        const sel = value === o.id;
        const cls = checked ? (o.id === item.answer ? 'is-correct' : sel ? 'is-wrong' : '') : '';
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={sel}
            className={`opt ${cls}`}
            disabled={checked}
            onClick={() => onChange(sel ? '' : o.id)}
            onKeyDown={(e) => {
              const idx = item.options.findIndex((x) => x.id === o.id);
              const next = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? idx + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? idx - 1 : -2;
              if (next !== -2) {
                e.preventDefault();
                const n = item.options[(next + item.options.length) % item.options.length];
                onChange(n.id);
                (document.getElementById(`${name}-${n.id}`) as HTMLElement | null)?.focus();
              }
            }}
            id={`${name}-${o.id}`}
          >
            <span className="bubble" aria-hidden="true">{o.id}</span>
            <span className="otext" lang="en">{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function LetterInput({ options, value, onChange, result, answer, label }: { options: Option[]; value: string; onChange: (v: string) => void; result?: ItemResult; answer: string; label: string }) {
  const checked = !!result;
  return (
    <div className="letters" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const sel = value === o.id;
        const cls = checked ? (o.id === answer && sel ? 'is-correct' : sel ? 'is-wrong' : o.id === answer ? 'answer-hint' : '') : '';
        return (
          <button key={o.id} type="button" role="radio" aria-checked={sel} aria-label={`${o.id}: ${o.text}`} className={`letter ${cls}`} disabled={checked} onClick={() => onChange(sel ? '' : o.id)}>
            {o.id}
          </button>
        );
      })}
    </div>
  );
}

export function OpenInput({ item, value, onChange, result, label, group }: { item: OpenItem; value: string; onChange: (v: string) => void; result?: ItemResult; label: string; group: TaskGroup }) {
  const cls = result ? (result.verdict === 'correct' ? 'is-correct' : 'is-wrong') : '';
  const isGramm = group.format === 'U_GRAMMATICALISE' || group.format === 'U_TRANSLATE_OPEN';
  return (
    <div className="field" lang="en">
      {item.before && <span className="ctx">{item.before}</span>}
      {isGramm && item.prompt && <span className="keyword" lang={group.format === 'U_TRANSLATE_OPEN' ? 'pl' : 'en'}>{item.prompt}</span>}
      <input
        className={`input ${cls}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        readOnly={!!result}
        enterKeyHint="next"
      />
      {item.after && <span className="ctx">{item.after}</span>}
      {item.maxWords && !result && <span className="hintline" lang="pl">Maks. {item.maxWords} {item.maxWords === 1 ? 'wyraz' : 'wyrazów'}.</span>}
    </div>
  );
}

export function GroupView(props: Props) {
  const { group, answers, onAnswer, results, audio, showTranscript, examMode } = props;
  const uid = useId();
  const full = fullGroup(group);
  const fmt = FORMATS[group.format];
  const resultFor = (id: string) => results?.find((r) => r.itemId === id);
  const hasMatch = group.items.some((i) => i.kind === 'match');

  return (
    <section aria-labelledby={`${uid}-t`}>
      <div className="row" style={{ marginBottom: '0.4rem' }}>
        <span className={`badge ${fmt.official ? 'official' : 'extra'}`}>{fmt.official ? 'Format maturalny' : 'Ćwiczenie dodatkowe'}</span>
        <span className="small muted">{fmt.namePl}</span>
      </div>
      <h2 id={`${uid}-t`} lang="en">{group.title}</h2>
      <div className="instruction">{group.instructionPl}</div>
      <Stimulus {...props} />

      {hasMatch && group.options && (
        <div className="card" style={{ marginTop: '0.8rem' }} lang="en">
          <ul className="optlist">
            {group.options.map((o) => (
              <li key={o.id}><b>{o.id}</b><span>{o.text}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="card" style={{ marginTop: '0.8rem' }}>
        {group.items.map((item) => {
          const n = full.items.findIndex((x) => x.id === item.id) + 1;
          const r = resultFor(item.id);
          const name = `${uid}-${item.id}`;
          const value = answers[item.id] ?? '';
          const label = `Pozycja ${n}`;
          let input: ReactNode = null;
          if (item.kind === 'mc') input = <McInput item={item} value={value} onChange={(v) => onAnswer(item.id, v)} result={r} name={name} />;
          else if (item.kind === 'match') input = <LetterInput options={group.options ?? []} value={value} onChange={(v) => onAnswer(item.id, v)} result={r} answer={item.answer} label={`${label}: wybierz literę`} />;
          else input = <OpenInput item={item} value={value} onChange={(v) => onAnswer(item.id, v)} result={r} label={`${label}: wpisz odpowiedź`} group={group} />;
          const showPrompt = item.prompt && !(item.kind === 'open' && (group.format === 'U_GRAMMATICALISE' || group.format === 'U_TRANSLATE_OPEN'));
          return (
            <div className="item" key={item.id}>
              <div id={`${name}-q`}>
                <span className="item-num" aria-hidden="true">{n}</span>
                <span className="sr-only">{label}. </span>
                {item.text && (
                  <div className="text-card" style={{ margin: '0.4rem 0' }} lang="en">
                    {item.text.title && <strong>{item.text.title}</strong>}
                    <div className="passage">{item.text.body}</div>
                  </div>
                )}
                {item.audio && (
                  <div style={{ margin: '0.4rem 0' }}>
                    <AudioPlayer clip={item.audio} rate={audio.rate} maxPlays={audio.maxPlays} plays={audio.plays?.[item.audio.id]} onPlayed={() => audio.onPlay?.(item.audio!.id)} showTranscript={showTranscript && !examMode} compact />
                  </div>
                )}
                {showPrompt && <span className="prompt" lang={group.format === 'U_TRANSLATION_MC' ? 'pl' : 'en'}>{item.prompt}</span>}
                {item.kind === 'open' && item.keyWord && <div style={{ marginTop: '0.3rem' }}><span className="keyword">{item.keyWord}</span></div>}
              </div>
              {input}
              {!examMode && <Feedback group={group} item={item} result={r} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
