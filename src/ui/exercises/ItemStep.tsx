import { type ReactNode, useEffect, useRef, useState } from 'react';
import { FORMATS } from '../../content/formats';
import type { Item, Option, TaskGroup } from '../../content/types';
import type { ItemResult } from '../../engine/validate';
import { AudioPlayer } from './AudioPlayer';
import type { AudioPolicy } from './GroupView';
import { fullGroup, GapText, McInput, OpenInput } from './GroupView';

/**
 * One question per screen (lesson mode). Shows only the context this item needs:
 * its own recording/text, the matching recording of a group (statement 3 → clip 3),
 * the passage with the current gap highlighted, or the texts as tabs.
 */

const tabMemory = new Map<string, number>();

/** Full-screen reading view for long passages, so the question screen stays uncluttered. */
function Reader({ title, children, onClose }: { title?: string; children: ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet reader" role="dialog" aria-modal="true" aria-label={title ?? 'Tekst'}>
        <div className="grab" />
        <div className="reader-body" lang="en">{children}</div>
        <button className="btn block" onClick={onClose}>Wróć do pytania</button>
      </div>
    </>
  );
}

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="expand" onClick={onClick} aria-label="Pokaż cały tekst na pełnym ekranie" lang="pl">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
    </button>
  );
}

function itemIndex(group: TaskGroup, item: Item) {
  return fullGroup(group).items.findIndex((x) => x.id === item.id);
}

function Instruction({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 110;
  if (!long || open) return <p className="step-instr">{text}</p>;
  return (
    <p className="step-instr">
      {text.slice(0, 100).replace(/\s+\S*$/, '')}…{' '}
      <button type="button" onClick={() => setOpen(true)}>więcej</button>
    </p>
  );
}

function TextTabs({ group, answers, current }: { group: TaskGroup; answers: Record<string, string>; current: string }) {
  const st = group.stimulus;
  const [tab, setTab] = useState(() => tabMemory.get(group.id) ?? 0);
  const [full, setFull] = useState(false);
  if (st.kind !== 'texts') return null;
  const t = st.texts[Math.min(tab, st.texts.length - 1)];
  const pick = (i: number) => { tabMemory.set(group.id, i); setTab(i); };
  return (
    <div className="ctx-panel tall" lang="en">
      <div className="ctx-tabs" role="tablist" aria-label="Teksty" lang="pl">
        {st.texts.map((x, i) => (
          <button key={x.label} type="button" role="tab" aria-selected={i === tab} onClick={() => pick(i)}>{x.label}</button>
        ))}
      </div>
      <ExpandButton onClick={() => setFull(true)} />
      <div className="ctx-text" key={tab} role="tabpanel">
        {t.title && <div className="passage-title">{t.title}</div>}
        <div className="passage"><GapText body={t.body} group={group} answers={answers} current={current} /></div>
      </div>
      {full && (
        <Reader title={t.title} onClose={() => setFull(false)}>
          {st.texts.map((x) => (
            <div key={x.label} className="text-card" style={{ marginBottom: '0.6rem' }}>
              <div style={{ marginBottom: '0.3rem' }}><span className="label">{x.label}</span>{x.title && <strong>{x.title}</strong>}</div>
              <div className="passage"><GapText body={x.body} group={group} answers={answers} current={current} /></div>
            </div>
          ))}
        </Reader>
      )}
    </div>
  );
}

function Passage({ group, answers, current }: { group: TaskGroup; answers: Record<string, string>; current: string }) {
  const st = group.stimulus;
  const ref = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const panel = ref.current;
    const gap = panel?.querySelector<HTMLElement>(`[data-gap="${CSS.escape(current)}"]`);
    if (panel && gap) panel.scrollTop = Math.max(0, gap.offsetTop - panel.offsetTop - panel.clientHeight / 3);
  }, [current]);
  if (st.kind !== 'text') return null;
  return (
    <div className="ctx-panel tall" lang="en" ref={ref}>
      <ExpandButton onClick={() => setFull(true)} />
      {st.title && <div className="passage-title">{st.title}</div>}
      <div className="passage"><GapText body={st.body} group={group} answers={answers} current={current} /></div>
      {st.source && <p className="small muted" lang="pl" style={{ margin: '0.5rem 0 0' }}>{st.source}</p>}
      {full && (
        <Reader title={st.title} onClose={() => setFull(false)}>
          {st.title && <div className="passage-title">{st.title}</div>}
          <div className="passage"><GapText body={st.body} group={group} answers={answers} current={current} /></div>
        </Reader>
      )}
    </div>
  );
}

function Context({ group, item, answers, audio, showTranscript }: { group: TaskGroup; item: Item; answers: Record<string, string>; audio: AudioPolicy; showTranscript: boolean }) {
  if (item.audio) {
    return <AudioPlayer clip={item.audio} rate={audio.rate} plays={audio.plays?.[item.audio.id]} onPlayed={() => audio.onPlay?.(item.audio!.id)} showTranscript={showTranscript} quietUnavailable />;
  }
  if (item.text) {
    return (
      <div className="ctx-panel" lang="en">
        {item.text.title && <div className="passage-title">{item.text.title}</div>}
        <div className="passage">{item.text.body}</div>
      </div>
    );
  }
  const st = group.stimulus;
  const n = itemIndex(group, item);
  if (st.kind === 'audio' && st.clips.length) {
    const clips = st.clips.length === fullGroup(group).items.length && st.clips[n] ? [st.clips[n]] : st.clips;
    return (
      <div className="stack">
        {clips.map((c) => (
          <AudioPlayer key={c.id} clip={c} rate={audio.rate} plays={audio.plays?.[c.id]} onPlayed={() => audio.onPlay?.(c.id)} showTranscript={showTranscript} compact={clips.length > 1} quietUnavailable />
        ))}
      </div>
    );
  }
  if (st.kind === 'text') return <Passage group={group} answers={answers} current={item.id} />;
  if (st.kind === 'texts') return <TextTabs group={group} answers={answers} current={item.id} />;
  return null;
}

function Choices({ options, value, onChange, result, answer, name }: { options: Option[]; value: string; onChange: (v: string) => void; result?: ItemResult; answer: string; name: string }) {
  // Matching items reuse the multiple-choice cards: letter + full option text.
  return <McInput item={{ kind: 'mc', id: name, options, answer, explanationPl: '' }} value={value} onChange={onChange} result={result} name={name} />;
}

export function ItemStep({
  group, item, answers, onAnswer, result, audio, showTranscript,
}: {
  group: TaskGroup;
  item: Item;
  answers: Record<string, string>;
  onAnswer: (v: string) => void;
  result?: ItemResult;
  audio: AudioPolicy;
  showTranscript: boolean;
}) {
  const fmt = FORMATS[group.format];
  const value = answers[item.id] ?? '';
  const name = `st-${item.id}`;
  const n = itemIndex(group, item) + 1;
  const total = fullGroup(group).items.length;
  const isGramm = group.format === 'U_GRAMMATICALISE' || group.format === 'U_TRANSLATE_OPEN';
  const showPrompt = item.prompt && !(item.kind === 'open' && isGramm);
  const prompt = item.kind === 'match' && !item.prompt ? `Pozycja ${n}` : item.prompt;

  return (
    <div className="step">
      <div className="step-kicker">
        <span>{fmt.namePl.replace(/^Trening: /, '')}</span>
        {total > 1 && <span className="count">{n}/{total}</span>}
      </div>
      {(n === 1 || total === 1) && <Instruction text={group.instructionPl} />}
      <Context group={group} item={item} answers={answers} audio={audio} showTranscript={showTranscript} />
      {showPrompt && <h2 className="step-prompt" id={`${name}-q`} lang={group.format === 'U_TRANSLATION_MC' || /^(Luka|Pozycja|Wypowiedź|Tekst|Zdanie) \d/.test(prompt ?? '') ? 'pl' : 'en'}>{prompt}</h2>}
      {item.kind === 'open' && item.keyWord && <div><span className="keyword">{item.keyWord}</span></div>}
      {item.kind === 'mc' && <McInput item={item} value={value} onChange={onAnswer} result={result} name={name} />}
      {item.kind === 'match' && <Choices options={group.options ?? []} value={value} onChange={onAnswer} result={result} answer={item.answer} name={name} />}
      {item.kind === 'open' && (
        <form onSubmit={(e) => e.preventDefault()}>
          <OpenInput item={item} value={value} onChange={onAnswer} result={result} label={`Pozycja ${n}: wpisz odpowiedź`} group={group} />
        </form>
      )}
    </div>
  );
}
