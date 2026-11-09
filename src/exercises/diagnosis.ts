/**
 * 错因诊断与统计（纯函数，无 React）。
 *
 * - 一次提交 → Diagnosis：hits（这次犯了哪些错因）与 avoided（有机会犯、但这次答对了的错因）。
 * - 统计：每个错因记录出现次数；在“别的题目”上连续避开 RESOLVE_AFTER 次即视为已纠正，
 *   再犯则重新计数。
 */
import { inverseDetectable, type PartGrade } from "./grader";
import { MISCONCEPTION_IDS, type MisconceptionId } from "./misconceptions";
import type { ChoiceBody, JudgeBody, NumericPart, Question, QuestionTemplate } from "./types";

export interface Diagnosis {
  hits: MisconceptionId[];
  avoided: MisconceptionId[];
}

export interface MisconceptionStat {
  /** 累计出现次数 */
  hits: number;
  /** 最近一次出现的时间戳 */
  lastHit: number;
  /** 最近一次出现之后，在其他题目上避开它的次数 */
  clean: number;
  /** 最近一次出现时的题目实例键 */
  lastKey: string;
}

export type MisconceptionStats = Partial<Record<MisconceptionId, MisconceptionStat>>;

/** 换题后连续避开几次算“已纠正” */
export const RESOLVE_AFTER = 2;

const EMPTY: Diagnosis = { hits: [], avoided: [] };

/** 一个数值空能够识别的错因（本题登记的 + 判题器的通用规则） */
export function partOpportunities(p: NumericPart): MisconceptionId[] {
  const s = new Set<MisconceptionId>();
  for (const m of p.mistakes ?? []) s.add(m.tag);
  if (p.expected < 0) s.add("sign");
  if (p.expected !== 0) {
    if (p.dim !== "1") s.add("unit-convert");
    if (p.dim === "Hz") s.add("omega-f");
    if (p.dim === "1" && inverseDetectable(p.expected)) s.add("ratio-inverted");
  }
  return [...s];
}

/** 一道题能够识别的全部错因 */
export function questionOpportunities(q: Question): MisconceptionId[] {
  const b = q.body;
  const s = new Set<MisconceptionId>();
  if (b.kind === "numeric") for (const p of b.parts) for (const t of partOpportunities(p)) s.add(t);
  if (b.kind === "choice") for (const t of b.tags ?? []) if (t) s.add(t);
  if (b.kind === "judge" && b.wrongTag) s.add(b.wrongTag);
  return [...s];
}

function finish(hits: Set<MisconceptionId>, avoided: Set<MisconceptionId>): Diagnosis {
  for (const h of hits) avoided.delete(h);
  return { hits: [...hits], avoided: [...avoided] };
}

export function diagnoseNumeric(parts: NumericPart[], grades: Record<string, PartGrade>): Diagnosis {
  const hits = new Set<MisconceptionId>();
  const avoided = new Set<MisconceptionId>();
  for (const p of parts) {
    const g = grades[p.id];
    if (!g || g.code === "empty") continue;
    if (g.correct) for (const t of partOpportunities(p)) avoided.add(t);
    else if (g.tag) hits.add(g.tag);
  }
  return finish(hits, avoided);
}

export function diagnoseChoice(body: ChoiceBody, picked: number): Diagnosis {
  if (!body.tags) return EMPTY;
  if (picked === body.answer) return finish(new Set(), new Set(body.tags.filter((t): t is MisconceptionId => Boolean(t))));
  const t = body.tags[picked];
  return t ? finish(new Set([t]), new Set()) : EMPTY;
}

export function diagnoseJudge(body: JudgeBody, picked: boolean): Diagnosis {
  if (!body.wrongTag) return EMPTY;
  return picked === body.answer ? { hits: [], avoided: [body.wrongTag] } : { hits: [body.wrongTag], avoided: [] };
}

/** 把一次提交的诊断合并进统计 */
export function applyDiagnosis(stats: MisconceptionStats, d: Diagnosis, key: string, t: number): MisconceptionStats {
  if (!d.hits.length && !d.avoided.length) return stats;
  const next: MisconceptionStats = { ...stats };
  for (const id of d.hits) {
    const prev = next[id];
    next[id] = { hits: (prev?.hits ?? 0) + 1, lastHit: t, clean: 0, lastKey: key };
  }
  for (const id of d.avoided) {
    const prev = next[id];
    // 只统计犯过的错因；在同一道题（同一组参数）上改对不算纠正
    if (prev && prev.lastKey !== key) next[id] = { ...prev, clean: prev.clean + 1 };
  }
  return next;
}

export function isResolved(s: MisconceptionStat): boolean {
  return s.clean >= RESOLVE_AFTER;
}

export interface ProfileRow {
  id: MisconceptionId;
  stat: MisconceptionStat;
  resolved: boolean;
}

/** 错因画像：未纠正的在前，其次按次数、最近时间排序 */
export function profileRows(stats: MisconceptionStats): ProfileRow[] {
  return MISCONCEPTION_IDS.filter((id) => (stats[id]?.hits ?? 0) > 0)
    .map((id) => ({ id, stat: stats[id]!, resolved: isResolved(stats[id]!) }))
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.stat.hits - a.stat.hits || b.stat.lastHit - a.stat.lastHit);
}

const TAG_CACHE = new Map<string, Set<MisconceptionId>>();
/** 参数化题取几个种子取并集（部分错误只在特定参数下出现） */
const SAMPLE_SEEDS = [1, 2, 3, 4, 5];

/** 一个题型能识别哪些错因 */
export function templateTags(t: QuestionTemplate): Set<MisconceptionId> {
  const hit = TAG_CACHE.get(t.id);
  if (hit) return hit;
  const s = new Set<MisconceptionId>();
  const qs = t.fixed ? [t.fixed] : SAMPLE_SEEDS.map((seed) => t.generate!(seed));
  for (const q of qs) for (const id of questionOpportunities(q)) s.add(id);
  TAG_CACHE.set(t.id, s);
  return s;
}

/**
 * 针对某个错因的练习题型。本题专门登记了该错因的排在前面；
 * 只靠通用规则（如符号、单位）才能识别的排在后面。
 */
export function templatesFor(id: MisconceptionId, templates: QuestionTemplate[]): QuestionTemplate[] {
  const specific: QuestionTemplate[] = [];
  const generic: QuestionTemplate[] = [];
  for (const t of templates) {
    if (!templateTags(t).has(id)) continue;
    if (explicitTags(t).has(id)) specific.push(t);
    else generic.push(t);
  }
  return [...specific, ...generic];
}

const EXPLICIT_CACHE = new Map<string, Set<MisconceptionId>>();
/** 题目本身登记的错因（不含判题器的通用规则） */
export function explicitTags(t: QuestionTemplate): Set<MisconceptionId> {
  const hit = EXPLICIT_CACHE.get(t.id);
  if (hit) return hit;
  const s = new Set<MisconceptionId>();
  const qs = t.fixed ? [t.fixed] : SAMPLE_SEEDS.map((seed) => t.generate!(seed));
  for (const q of qs) {
    const b = q.body;
    if (b.kind === "numeric") for (const p of b.parts) for (const m of p.mistakes ?? []) s.add(m.tag);
    if (b.kind === "choice") for (const x of b.tags ?? []) if (x) s.add(x);
    if (b.kind === "judge" && b.wrongTag) s.add(b.wrongTag);
  }
  EXPLICIT_CACHE.set(t.id, s);
  return s;
}
