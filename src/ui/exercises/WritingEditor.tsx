import { FORMATS } from '../../content/formats';
import type { WritingPrompt } from '../../content/types';
import { countWritingWords, WRITING_MAX_WORDS, WRITING_MIN_WORDS, WRITING_SCORING_THRESHOLD } from '../../engine/writing';

/** Phone-friendly editor: instructions stay above, the opening is fixed, a sticky word counter follows the text. */
export function WritingEditor({ prompt, value, onChange, readOnly }: { prompt: WritingPrompt; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  const words = countWritingWords(value);
  const cls = words < WRITING_SCORING_THRESHOLD ? 'short' : words >= WRITING_MIN_WORDS && words <= WRITING_MAX_WORDS ? 'ok' : '';
  const hint =
    words < WRITING_SCORING_THRESHOLD ? `Poniżej ${WRITING_SCORING_THRESHOLD} wyrazów oceniana jest tylko treść`
      : words < WRITING_MIN_WORDS ? `Celuj w ${WRITING_MIN_WORDS}–${WRITING_MAX_WORDS}`
      : words <= WRITING_MAX_WORDS ? 'Długość w normie'
      : 'Powyżej 150 – bez kary, ale więcej ryzyka błędów';
  return (
    <div>
      <div className="card">
        <span className="badge official">{FORMATS[prompt.format].namePl}</span>
        <p style={{ marginTop: '0.5rem' }}><strong>{prompt.situationPl}</strong></p>
        <ol className="points-list">
          {prompt.points.map((p) => <li key={p.id}>{p.textPl}</li>)}
        </ol>
        <p className="small muted" style={{ marginBottom: 0 }}>Napisz wypowiedź po angielsku. Rozwiń każdy z czterech podpunktów, tak aby osoba nieznająca polecenia uzyskała wszystkie informacje. Długość: {WRITING_MIN_WORDS}–{WRITING_MAX_WORDS} wyrazów (nie licząc podanego początku). Oceniane są: treść, spójność i logika, zakres oraz poprawność środków językowych.</p>
      </div>
      <div style={{ marginTop: '0.8rem' }}>
        <div className="opening" lang="en" aria-label="Podany początek wypowiedzi">{prompt.opening}</div>
        <textarea
          className="editor"
          lang="en"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          aria-label="Twoja wypowiedź"
          aria-describedby="wc"
          spellCheck={false}
          autoCapitalize="sentences"
          placeholder="Zacznij pisać tutaj…"
        />
        <div className={`wordcount ${cls}`} id="wc" aria-live="polite">
          <span>{words} {words === 1 ? 'wyraz' : 'wyrazów'}</span>
          <span className="small">{hint}</span>
        </div>
      </div>
    </div>
  );
}
