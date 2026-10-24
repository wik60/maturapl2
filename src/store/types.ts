import type { Section, Skill } from '../content/types';
import type { Verdict } from '../engine/validate';
import type { CriteriaScores } from '../engine/writing';
import type { AssembledExam } from '../exam/assemble';
import type { SrsCard } from '../game/srs';

export type AttemptMode = 'practice' | 'map' | 'mistakes' | 'diagnostic' | 'exam' | 'transcript';

export interface Attempt {
  id: string;
  itemId: string;
  groupId: string;
  format: string;
  skill: Skill;
  section: Section;
  tag?: string;
  difficulty: number;
  given: string;
  verdict: Verdict;
  ts: number;
  mode: AttemptMode;
  sessionId: string;
}

export interface MistakeEntry {
  itemId: string;
  groupId: string;
  skill: Skill;
  lastGiven: string;
  count: number;
  firstTs: number;
  lastTs: number;
  mastered: boolean;
  card: SrsCard;
}

export interface PracticeSession {
  id: string;
  kind: 'practice' | 'map' | 'mistakes' | 'diagnostic';
  title: string;
  /** Group ids, or "group#item" for single-item sessions (diagnostic, mistakes). */
  units: string[];
  answers: Record<string, string>;
  submitted: string[]; // unit ids already checked
  levelId?: string;
  contentVersion: number;
  startedAt: number;
  finishedAt?: number;
  listeningFallback?: Record<string, boolean>;
  /** XP earned by answers in this session (shown on the summary). */
  xpEarned?: number;
}

export interface ExamResult {
  points: number;
  max: number;
  sections: Record<string, { points: number; max: number }>;
  writing?: { range: [number, number]; estimate: number; criteria: CriteriaScores };
  invalidItems: number;
}

export interface ExamSession {
  id: string;
  type: 'original-blueprint';
  exam: AssembledExam;
  answers: Record<string, string>;
  writing: Record<string, string>;
  plays: Record<string, number>;
  startedAt: number;
  deadline: number;
  autoSubmit: boolean;
  submittedAt?: number;
  result?: ExamResult;
  contentVersion: number;
}

export interface QuestState {
  id: string;
  type: QuestType;
  target: number;
  progress: number;
  done: boolean;
}

export type QuestType = 'listening-items' | 'reading-items' | 'language-items' | 'vocab-reviews' | 'fix-mistakes' | 'writing' | 'any-items';

export interface LevelProgress {
  best: number; // 0..1
  attempts: number;
  completedAt?: number;
  masteredAt?: number;
}

export interface WritingRecord {
  id: string;
  promptId: string;
  ts: number;
  words: number;
  range: [number, number];
  estimate: number;
  criteria: CriteriaScores;
}

export interface Settings {
  name: string;
  timeZone: string;
  dailyGoalItems: number;
  sound: boolean;
  motion: 'system' | 'reduced';
  textSize: 'normal' | 'large';
  theme: string; // cosmetic ink colour id
  speechRate: number;
}

export interface DiagnosticProfile {
  ts: number;
  bySkill: Record<string, { correct: number; total: number }>;
  strongest: string[];
  weakest: string[];
  uncertain: string[];
}

export interface AppState {
  schemaVersion: number;
  createdAt: number;
  xp: number;
  coins: number;
  ledger: Record<string, number>; // reward key -> ts (idempotency)
  days: Record<string, { items: number; sessions: number; vocab: number }>;
  attempts: Attempt[];
  mistakes: Record<string, MistakeEntry>;
  vocab: Record<string, SrsCard & { known?: boolean }>;
  sessions: Record<string, PracticeSession>;
  activeSessionId?: string;
  exams: Record<string, ExamSession>;
  activeExamId?: string;
  quests: { day: string; list: QuestState[] };
  achievements: Record<string, number>;
  levels: Record<string, LevelProgress>;
  writing: { drafts: Record<string, string>; history: WritingRecord[] };
  diagnostic?: DiagnosticProfile;
  purchases: string[];
  settings: Settings;
  bestStreak: number;
  bestRun: number; // correct answers in a row
  currentRun: number;
}

export interface RewardSummary {
  xp: number;
  coins: number;
  levelUp?: number;
  achievements: string[];
  questsDone: string[];
}
