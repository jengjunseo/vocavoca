import type { AssessmentItem, AssessmentItemType, AssessmentMeta, Card, Deck, Direction, StudyEvent } from "./types";

export type RawCard = { id?: unknown; term?: unknown; meanings?: unknown; example?: unknown; exampleMeaning?: unknown; acceptedAnswers?: unknown; assessment?: unknown };

const clean = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ");
export const normalizeAnswer = (value: string) => clean(value).toLocaleLowerCase();
const assessmentTypes: AssessmentItemType[] = ["recall", "blank", "rival", "match"];

function validateAssessment(input: unknown, label: string): { ok: true; value: AssessmentMeta } | { ok: false; error: string } {
  if (input === undefined) return { ok: true, value: {} };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: `${label}의 assessment는 객체여야 합니다.` };
  const data = input as Record<string, unknown>;
  if (data.anchors !== undefined && (!Array.isArray(data.anchors) || data.anchors.some((value) => typeof value !== "string" || !clean(value)))) return { ok: false, error: `${label}의 assessment.anchors는 문자열 배열이어야 합니다.` };
  if (data.confusionGroups !== undefined && (!Array.isArray(data.confusionGroups) || data.confusionGroups.some((group) => typeof group === "string" ? !clean(group) : !group || typeof group !== "object" || typeof (group as Record<string, unknown>).id !== "string" || !Array.isArray((group as Record<string, unknown>).terms) || ((group as Record<string, unknown>).terms as unknown[]).some((term) => typeof term !== "string" || !clean(term))))) return { ok: false, error: `${label}의 assessment.confusionGroups 형식이 올바르지 않습니다.` };
  if (data.items !== undefined && (!Array.isArray(data.items) || data.items.some((item) => { if (!item || typeof item !== "object") return true; const value = item as Record<string, unknown>; return typeof value.id !== "string" || !clean(value.id) || typeof value.type !== "string" || !assessmentTypes.includes(value.type as AssessmentItemType) || typeof value.prompt !== "string" || !clean(value.prompt) || typeof value.answer !== "string" || !clean(value.answer) || (value.acceptedAnswers !== undefined && (!Array.isArray(value.acceptedAnswers) || value.acceptedAnswers.some((answer) => typeof answer !== "string" || !clean(answer)))) || (value.anchors !== undefined && (!Array.isArray(value.anchors) || value.anchors.some((anchor) => typeof anchor !== "string" || !clean(anchor)))); }))) return { ok: false, error: `${label}의 assessment.items에는 id, type, prompt, answer가 필요합니다.` };
  const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]).map((item) => ({ id: clean(item.id as string), type: item.type as AssessmentItemType, prompt: clean(item.prompt as string), answer: clean(item.answer as string), acceptedAnswers: Array.isArray(item.acceptedAnswers) ? (item.acceptedAnswers as string[]).map(clean) : undefined, anchors: Array.isArray(item.anchors) ? (item.anchors as string[]).map(clean) : undefined, rule: typeof item.rule === "string" ? clean(item.rule) : undefined, confusionGroupId: typeof item.confusionGroupId === "string" ? clean(item.confusionGroupId) : undefined })) : undefined;
  return { ok: true, value: { anchors: Array.isArray(data.anchors) ? (data.anchors as string[]).map(clean) : undefined, confusionGroups: Array.isArray(data.confusionGroups) ? data.confusionGroups.map((group) => typeof group === "string" ? clean(group) : { id: clean((group as Record<string, unknown>).id as string), terms: ((group as Record<string, unknown>).terms as string[]).map(clean) }) : undefined, items } };
}

export function validateImport(input: unknown): { ok: true; value: { version: 1; title: string; description?: string; assessment?: AssessmentMeta; cards: RawCard[] }; warnings: string[] } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "JSON 최상위 값은 객체여야 합니다." };
  const data = input as Record<string, unknown>;
  if (data.version === undefined) return { ok: false, error: "version 항목이 없습니다." };
  if (data.version !== 1) return { ok: false, error: "지원하지 않는 version입니다. 현재 1만 지원합니다." };
  if (typeof data.title !== "string" || !clean(data.title)) return { ok: false, error: "title은 비어 있지 않은 문자열이어야 합니다." };
  if (!Array.isArray(data.cards) || data.cards.length === 0) return { ok: false, error: "cards는 비어 있지 않은 배열이어야 합니다." };
  if (data.cards.length > 5000) return { ok: false, error: "카드는 최대 5,000개까지 가져올 수 있습니다." };
  const deckAssessment = validateAssessment(data.assessment, "단어장");
  if (!deckAssessment.ok) return deckAssessment;
  const warnings: string[] = [];
  const terms = new Set<string>();
  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i] as RawCard;
    const label = `${i + 1}번째 카드`;
    if (!card || typeof card !== "object" || Array.isArray(card)) return { ok: false, error: `${label}는 객체여야 합니다.` };
    if (typeof card.term !== "string" || !clean(card.term)) return { ok: false, error: `${label}의 term은 비어 있지 않은 문자열이어야 합니다.` };
    if (card.id !== undefined && (typeof card.id !== "string" || !clean(card.id))) return { ok: false, error: `${label}의 id는 비어 있지 않은 문자열이어야 합니다.` };
    if (!Array.isArray(card.meanings) || card.meanings.length === 0 || card.meanings.some((m) => typeof m !== "string" || !clean(m))) return { ok: false, error: `${label}의 meanings는 비어 있지 않은 문자열 배열이어야 합니다.` };
    for (const [key, value] of [["example", card.example], ["exampleMeaning", card.exampleMeaning]] as const) if (value !== undefined && (typeof value !== "string" || !clean(value))) return { ok: false, error: `${label}의 ${key}는 문자열이어야 합니다.` };
    if (card.acceptedAnswers !== undefined && (!Array.isArray(card.acceptedAnswers) || card.acceptedAnswers.some((a) => typeof a !== "string" || !clean(a)))) return { ok: false, error: `${label}의 acceptedAnswers는 문자열 배열이어야 합니다.` };
    const cardAssessment = validateAssessment(card.assessment, label);
    if (!cardAssessment.ok) return cardAssessment;
    const term = normalizeAnswer(card.term);
    if (terms.has(term)) warnings.push(`“${clean(card.term)}” 단어가 여러 번 등장합니다.`);
    terms.add(term);
  }
  return { ok: true, value: { version: 1, title: clean(data.title), description: typeof data.description === "string" ? clean(data.description) : undefined, assessment: Object.keys(deckAssessment.value).length ? deckAssessment.value : undefined, cards: data.cards as RawCard[] }, warnings };
}

export function makeDeck(input: { version: 1; title: string; description?: string; assessment?: AssessmentMeta; cards: readonly RawCard[] }, now = new Date()): Deck {
  const iso = now.toISOString();
  const id = crypto.randomUUID();
  const sourceCards = input.cards.map((c) => ({ id: typeof c.id === "string" ? clean(c.id) : undefined, term: clean(c.term as string), meanings: (c.meanings as string[]).map(clean), example: c.example ? clean(c.example as string) : undefined, exampleMeaning: c.exampleMeaning ? clean(c.exampleMeaning as string) : undefined, acceptedAnswers: Array.isArray(c.acceptedAnswers) ? (c.acceptedAnswers as string[]).map(clean) : undefined, assessment: c.assessment as AssessmentMeta | undefined }));
  return { id, version: 1, title: input.title, description: input.description, assessment: input.assessment, sourceCards, cards: input.cards.map((c, index) => ({ id: crypto.randomUUID(), sourceId: sourceCards[index].id, term: clean(c.term as string), meanings: (c.meanings as string[]).map(clean), example: c.example ? clean(c.example as string) : undefined, exampleMeaning: c.exampleMeaning ? clean(c.exampleMeaning as string) : undefined, acceptedAnswers: Array.isArray(c.acceptedAnswers) ? (c.acceptedAnswers as string[]).map(clean) : undefined, assessment: c.assessment as AssessmentMeta | undefined, createdAt: iso, state: "new", reps: 0, lapses: 0 })), createdAt: iso, updatedAt: iso };
}

export function answerIsCorrect(card: Card, answer: string, direction: Direction) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  const answers = direction === "term-to-meaning" ? [...card.meanings, ...(card.acceptedAnswers ?? [])] : [card.term];
  return answers.some((item) => normalizeAnswer(item) === normalized);
}

export function dueCards(deck: Deck, now = new Date()) { return deck.cards.filter((c) => c.state !== "new" && c.dueAt && new Date(c.dueAt) <= now).sort((a, b) => new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime()); }
export function reviewQueue(deck: Deck, events: StudyEvent[], settingsLimit: number, now = new Date()) {
  const due = dueCards(deck, now);
  const today = now.toISOString().slice(0, 10);
  const studiedNew = new Set(events.filter((e) => e.createdAt.slice(0, 10) === today && deck.cards.find((c) => c.id === e.cardId)?.state !== "new").map((e) => e.cardId));
  const fresh = deck.cards.filter((c) => c.state === "new" && !studiedNew.has(c.id)).slice(0, Math.max(0, settingsLimit - studiedNew.size));
  return [...due, ...fresh];
}

export function nextSchedule(card: Card, rating: "again" | "hard" | "good" | "easy", now = new Date()) {
  const current = card.intervalDays ?? 0;
  const days = rating === "again" ? 0 : rating === "hard" ? Math.max(1, Math.round(Math.max(1, current) * 1.4)) : rating === "good" ? Math.max(1, Math.round(Math.max(1, current) * 2.4)) : Math.max(2, Math.round(Math.max(1, current) * 3.8));
  const due = new Date(now);
  if (rating === "again") due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + days);
  return { dueAt: due.toISOString(), intervalDays: days, state: days >= 21 ? "review" as const : "learning" as const };
}

export function quizChoices(card: Card, deck: Deck, direction: Direction) {
  const correct = direction === "term-to-meaning" ? card.meanings[0] : card.term;
  const candidates = deck.cards.flatMap((other) => direction === "term-to-meaning" ? other.meanings : [other.term]).filter((item) => normalizeAnswer(item) !== normalizeAnswer(correct) && ![...card.meanings, ...(card.acceptedAnswers ?? []), card.term].some((answer) => normalizeAnswer(answer) === normalizeAnswer(item)));
  return [...new Set([correct, ...candidates.sort(() => Math.random() - 0.5)])].slice(0, 4).sort(() => Math.random() - 0.5);
}

export function createEvent(deckId: string, cardId: string, kind: StudyEvent["kind"], extras: Partial<StudyEvent> = {}, now = new Date()): StudyEvent { return { id: crypto.randomUUID(), deckId, cardId, kind, createdAt: now.toISOString(), ...extras }; }

export type AssessmentQuestion = {
  id: string;
  itemId: string;
  type: AssessmentItemType;
  cardId: string;
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  anchors?: string[];
  rule?: string;
  confusionGroupId?: string;
  options?: string[];
  matchPairs?: Array<{ itemId: string; prompt: string; answer: string; acceptedAnswers: string[]; cardId: string }>;
};

function itemCard(deck: Deck, item: AssessmentItem) { return deck.cards.find((card) => card.assessment?.items?.some((candidate) => candidate.id === item.id)) ?? deck.cards.find((card) => [card.term, ...card.acceptedAnswers ?? []].some((answer) => normalizeAnswer(answer) === normalizeAnswer(item.answer))) ?? deck.cards[0]; }

export function assessmentItems(deck: Deck): AssessmentItem[] {
  const explicit = deck.cards.flatMap((card) => card.assessment?.items ?? []);
  if (explicit.length) return explicit;
  return deck.cards.filter((card) => card.assessment).map((card) => ({ id: `${card.sourceId ?? card.id}-recall`, type: "recall", prompt: card.term, answer: card.meanings[0], acceptedAnswers: card.acceptedAnswers ? [...card.acceptedAnswers] : undefined, anchors: card.assessment?.anchors, confusionGroupId: undefined }));
}

export function hasAssessmentData(deck: Deck) { return assessmentItems(deck).length > 0; }

export function assessmentPriority(item: AssessmentItem, events: StudyEvent[], now = new Date()) {
  const related = events.filter((event) => event.kind === "assessment" && event.assessmentItemId === item.id);
  const wrong = related.filter((event) => event.correct === false).length;
  const uncertain = related.filter((event) => event.uncertain).length;
  const recentWrong = related.filter((event) => event.correct === false && now.getTime() - new Date(event.createdAt).getTime() < 7 * 86400000).length;
  const formWeakness = item.type === "blank" || Boolean(item.rule?.match(/-ing|p\.p\.|plural|passive/i)) ? 1 : 0;
  return wrong * 5 + recentWrong * 4 + uncertain * 3 + (item.confusionGroupId ? 3 : 0) + formWeakness * 2 + (related.length === 0 ? 1 : 0);
}

export function weakAssessmentItems(deck: Deck, events: StudyEvent[], now = new Date()) { return assessmentItems(deck).sort((a, b) => assessmentPriority(b, events, now) - assessmentPriority(a, events, now)); }
export function wrongAssessmentItems(deck: Deck, events: StudyEvent[]) { const ids = new Set(events.filter((event) => event.kind === "assessment" && event.correct === false).map((event) => event.assessmentItemId)); return assessmentItems(deck).filter((item) => ids.has(item.id)); }
export function uncertainAssessmentItems(deck: Deck, events: StudyEvent[]) { const ids = new Set(events.filter((event) => event.kind === "assessment" && event.uncertain).map((event) => event.assessmentItemId)); return assessmentItems(deck).filter((item) => ids.has(item.id)); }

function questionFromItem(deck: Deck, item: AssessmentItem, type: AssessmentItemType): AssessmentQuestion {
  const card = itemCard(deck, item);
  return { id: `${item.id}-${type}`, itemId: item.id, type, cardId: card?.id ?? "", prompt: item.prompt, answer: item.answer, acceptedAnswers: [...item.acceptedAnswers ?? [], ...(card?.acceptedAnswers ?? [])], anchors: item.anchors ? [...item.anchors] : card?.assessment?.anchors ? [...card.assessment.anchors] : deck.assessment?.anchors ? [...deck.assessment.anchors] : undefined, rule: item.rule, confusionGroupId: item.confusionGroupId };
}

export function buildRecallQuestion(deck: Deck, item: AssessmentItem) { return questionFromItem(deck, item, "recall"); }
export function buildBlankQuestion(deck: Deck, item: AssessmentItem) { return questionFromItem(deck, item, "blank"); }

function groupTerms(deck: Deck, item: AssessmentItem) {
  const group = deck.assessment?.confusionGroups?.find((candidate) => typeof candidate !== "string" && candidate.id === item.confusionGroupId);
  const fromMeta = typeof group === "object" ? group.terms : [];
  const fromItems = assessmentItems(deck).filter((candidate) => candidate.confusionGroupId === item.confusionGroupId).map((candidate) => itemCard(deck, candidate)?.term).filter(Boolean) as string[];
  return [...new Set([...fromMeta, ...fromItems])];
}

export function buildRivalQuestion(deck: Deck, item: AssessmentItem) {
  const question = questionFromItem(deck, item, "rival");
  const correctTerm = itemCard(deck, item)?.term ?? item.answer;
  const options = [...new Set([correctTerm, ...groupTerms(deck, item)])].slice(0, 5);
  return { ...question, acceptedAnswers: [...question.acceptedAnswers, correctTerm], options: options.length >= 2 ? options : undefined };
}

export function buildMatchingPuzzle(deck: Deck, items: AssessmentItem[]) {
  const candidates = items.filter((item) => item.type === "match");
  if (candidates.length < 4) return null;
  const selected = candidates.slice(0, 4);
  const first = selected[0];
  return { id: `match-${selected.map((item) => item.id).join("-")}`, itemId: first.id, type: "match" as const, cardId: itemCard(deck, first)?.id ?? "", prompt: "각 문장에 가장 잘 맞는 단어를 한 번씩 배치하세요.", answer: "", acceptedAnswers: [], confusionGroupId: first.confusionGroupId, matchPairs: selected.map((item) => { const question = questionFromItem(deck, item, "match"); return { itemId: item.id, prompt: item.prompt, answer: item.answer, acceptedAnswers: question.acceptedAnswers, cardId: question.cardId }; }), options: selected.map((item) => item.answer) } satisfies AssessmentQuestion;
}

function seededShuffle<T>(values: T[], seed: number) { const output = [...values]; let state = seed >>> 0; for (let i = output.length - 1; i > 0; i--) { state = (state * 1664525 + 1013904223) >>> 0; const j = state % (i + 1); [output[i], output[j]] = [output[j], output[i]]; } return output; }
function takeRepeated<T>(pool: T[], count: number, key: (value: T) => string) { if (!pool.length) return []; const output: T[] = []; for (let i = 0; i < count && i < pool.length * 2; i++) output.push(pool[i % pool.length]); return output.filter((value, index) => index === 0 || key(value) !== key(output[index - 1])); }

/**
 * Full performance run: one direct-typing question per card, shuffled each run.
 * Prefer a blank item, then rival/recall/first explicit item. Rival items are
 * intentionally rendered as blanks here so the full 154-card drill never
 * falls back to multiple choice. Card-level acceptedAnswers are NOT merged
 * into these questions because they usually contain Korean meaning aliases,
 * which must not be accepted as answers to English sentence blanks.
 */
export function buildFullAssessmentSession(deck: Deck, seed = 7) {
  const questions = deck.cards.flatMap((card) => {
    const items = card.assessment?.items ?? [];
    const item = items.find((candidate) => candidate.type === "blank") ?? items.find((candidate) => candidate.type === "rival") ?? items.find((candidate) => candidate.type === "recall") ?? items[0];
    if (!item) return [];
    return [{
      id: `${item.id}-full-typing`,
      itemId: item.id,
      type: "blank" as const,
      cardId: card.id,
      prompt: item.prompt,
      answer: item.answer,
      acceptedAnswers: [...item.acceptedAnswers ?? []],
      anchors: item.anchors ? [...item.anchors] : card.assessment?.anchors ? [...card.assessment.anchors] : deck.assessment?.anchors ? [...deck.assessment.anchors] : undefined,
      rule: item.rule,
      confusionGroupId: item.confusionGroupId,
    } satisfies AssessmentQuestion];
  });
  return seededShuffle(questions, seed);
}

export function buildAssessmentSession(deck: Deck, events: StudyEvent[], seed = 7, targetCount = 30) {
  const items = weakAssessmentItems(deck, events);
  const recallPool = items.filter((item) => item.type === "recall" || item.type === "blank").map((item) => item.type === "blank" ? buildBlankQuestion(deck, item) : buildRecallQuestion(deck, item));
  const rivalPool = items.filter((item) => item.type === "rival").map((item) => buildRivalQuestion(deck, item));
  const match = buildMatchingPuzzle(deck, items);
  const matchPool = match ? [match] : [];
  const total = Math.min(targetCount, Math.max(3, (recallPool.length + rivalPool.length + matchPool.length) * 2));
  let recallCount = Math.round(total * 0.6); let rivalCount = Math.round(total * 0.25); let matchCount = total - recallCount - rivalCount;
  if (!recallPool.length) { matchCount += recallCount; recallCount = 0; }
  if (!rivalPool.length) { recallCount += rivalCount; rivalCount = 0; }
  if (!matchPool.length) { recallCount += matchCount; matchCount = 0; }
  const queue = [...takeRepeated(recallPool, recallCount, (question) => question.itemId), ...takeRepeated(rivalPool, rivalCount, (question) => question.itemId), ...takeRepeated(matchPool, matchCount, (question) => question.id)];
  const shuffled = seededShuffle(queue, seed);
  for (let i = 1; i < shuffled.length; i++) if (shuffled[i].itemId === shuffled[i - 1].itemId && shuffled.length > 1) { const swap = (i + 1) % shuffled.length; [shuffled[i], shuffled[swap]] = [shuffled[swap], shuffled[i]]; }
  return shuffled;
}

export function assessmentAnswerIsCorrect(question: AssessmentQuestion, answer: string) { const normalized = normalizeAnswer(answer); return Boolean(normalized) && [question.answer, ...question.acceptedAnswers].some((candidate) => normalizeAnswer(candidate) === normalized); }
export function matchAnswerIsCorrect(pair: NonNullable<AssessmentQuestion["matchPairs"]>[number], answer: string) { const normalized = normalizeAnswer(answer); return [pair.answer, ...pair.acceptedAnswers].some((candidate) => normalizeAnswer(candidate) === normalized); }
export function updateMastery(current: number, correct: boolean, uncertain: boolean, responseMs: number) { if (uncertain) return Math.max(0, current - 8); const speedBonus = correct && responseMs <= 3000 ? 3 : 0; return Math.max(0, Math.min(100, current + (correct ? 12 + speedBonus : -20))); }
export function createAssessmentEvent(deckId: string, question: AssessmentQuestion, sessionId: string, answer: string, correct: boolean, uncertain: boolean, responseMs: number, mastery: number, now = new Date()) { return createEvent(deckId, question.cardId, "assessment", { sessionId, assessmentItemId: question.itemId, assessmentType: question.type, userAnswer: answer, expectedAnswer: question.answer, correct, uncertain, confusionGroupId: question.confusionGroupId, formRule: question.rule, responseMs, mastery }, now); }
