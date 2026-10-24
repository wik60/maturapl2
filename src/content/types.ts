/**
 * Content model for Matura Quest.
 *
 * A "TaskGroup" mirrors what CKE calls a "wiązka zadań": one stimulus (recording,
 * text or set of texts) with several numbered items. Every item is worth 1 point,
 * exactly as in the official marking scheme; writing is scored separately (0–12).
 */

export type Section = 'listening' | 'reading' | 'language' | 'writing' | 'supplementary';

export type Skill =
  | 'listening'
  | 'reading'
  | 'grammar'
  | 'vocabulary'
  | 'functions'
  | 'writing';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Official task formats verified against CKE materials + supplementary training formats. */
export type FormatId =
  // Rozumienie ze słuchu
  | 'L_MATCH'
  | 'L_MC'
  | 'L_GAP'
  // Rozumienie tekstów pisanych
  | 'R_MATCH'
  | 'R_MULTI'
  | 'R_MC'
  | 'R_SENTENCE_GAP'
  // Znajomość środków językowych
  | 'U_DIALOG_MC'
  | 'U_LEXICAL_SET'
  | 'U_TRANSLATION_MC'
  | 'U_GRAMMAR_MC'
  | 'U_OPEN_CLOZE'
  | 'U_TRANSFORM'
  | 'U_GRAMMATICALISE'
  | 'U_TRANSLATE_OPEN'
  // Wypowiedź pisemna
  | 'W_EMAIL'
  | 'W_BLOG'
  | 'W_FORUM'
  // Supplementary (not standalone exam formats)
  | 'S_GRAMMAR_DRILL'
  | 'S_SENTENCE_BUILD';

export interface Option {
  id: string; // 'A' | 'B' | ...
  text: string;
}

export type Marking =
  /** Full grammatical + spelling accuracy (środki językowe). Case differences accepted. */
  | 'strict'
  /** Listening/reading open answers: message must be clear; minor spelling slips tolerated in longer non-numeric words. */
  | 'comprehension';

export interface AudioLine {
  speaker: string; // display name, e.g. 'Woman', 'Presenter'
  voice: 'f' | 'm';
  text: string;
}

export interface AudioClip {
  id: string;
  label: string; // 'Nagranie 1'
  lines: AudioLine[];
  /** Optional pre-recorded file. When absent the app synthesises speech in the browser. */
  url?: string;
}

interface ItemBase {
  id: string;
  /** Question stem / prompt (English, or Polish context for functions & translation). */
  prompt?: string;
  explanationPl: string;
  /** Short grammar rule or vocabulary note shown with feedback. */
  rule?: string;
  example?: string;
  /** Where in the text/recording the answer is supported (reading/listening). */
  evidence?: string;
  /** Why particular distractors are wrong, keyed by option id. */
  distractorNotes?: Record<string, string>;
  /** Fine-grained tag used for recommendations, e.g. 'present-perfect'. */
  tag?: string;
  /** Item-level recording (e.g. six short dialogues, one question each). */
  audio?: AudioClip;
  /** Item-level short text (e.g. reading MC with one short notice per item). */
  text?: { title?: string; body: string };
}

export interface McItem extends ItemBase {
  kind: 'mc';
  options: Option[];
  answer: string;
}

export interface MatchItem extends ItemBase {
  kind: 'match';
  /** Uses group.options; answer is one option id. */
  answer: string;
}

export interface OpenItem extends ItemBase {
  kind: 'open';
  /**
   * Accepted answers. Parentheses mark optional words: "(the) station".
   * A slash inside parentheses is NOT supported — list alternatives separately.
   */
  accepted: string[];
  marking: Marking;
  /** Maximum words allowed in the answer (CKE: e.g. max 5 in transformations). */
  maxWords?: number;
  /** Text shown before/after the input when rendered inline. */
  before?: string;
  after?: string;
  /** Words the learner must use, e.g. key word in transformations. */
  keyWord?: string;
}

export type Item = McItem | MatchItem | OpenItem;

export type Stimulus =
  | { kind: 'none' }
  | { kind: 'text'; title?: string; body: string; source?: string }
  | { kind: 'texts'; texts: { label: string; title?: string; body: string }[] }
  | { kind: 'audio'; clips: AudioClip[] };

export interface SourceInfo {
  type: 'original' | 'licensed' | 'official';
  author: string;
  /** Specification the format follows. */
  spec: string;
  note?: string;
}

export interface TaskGroup {
  id: string;
  format: FormatId;
  title: string;
  instructionPl: string;
  stimulus: Stimulus;
  /** Shared options for matching / sentence-gap tasks. */
  options?: Option[];
  items: Item[];
  topic: string;
  difficulty: Difficulty;
  source: SourceInfo;
  contentVersion: number;
}

export interface WritingPoint {
  id: string;
  textPl: string;
  /** Lower-case keywords / regex sources that indicate the point is addressed. */
  cues: string[];
  /** If the point is about a past event, past-tense verbs are expected. */
  pastTense?: boolean;
}

export interface WritingPrompt {
  id: string;
  format: 'W_EMAIL' | 'W_BLOG' | 'W_FORUM';
  situationPl: string;
  points: WritingPoint[]; // always 4 at basic level
  opening: string; // given beginning, not counted
  closingHint?: string;
  topic: string;
  difficulty: Difficulty;
  modelAnswer: string;
  usefulPhrases: string[];
  source: SourceInfo;
  contentVersion: number;
}

export interface VocabEntry {
  id: string;
  en: string;
  pl: string;
  topic: string; // matches podstawa programowa areas I.1–I.14
  example: string;
  level: 'A2' | 'B1' | 'B1+';
}

export interface FormatInfo {
  id: FormatId;
  section: Section;
  skill: Skill;
  namePl: string;
  official: boolean;
  /** Reference to the verified source of the format. */
  basis: string;
  component: string;
  validator: string;
}
