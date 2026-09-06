import type { Card, Deck, Direction, StudyEvent } from "./types";

export type RawCard = { term?: unknown; meanings?: unknown; example?: unknown; exampleMeaning?: unknown; acceptedAnswers?: unknown };

const clean = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ");
export const normalizeAnswer = (value: string) => clean(value).toLocaleLowerCase();

export function validateImport(input: unknown): { ok: true; value: { version: 1; title: string; description?: string; cards: RawCard[] }; warnings: string[] } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "JSON 최상위 값은 객체여야 합니다." };
  const data = input as Record<string, unknown>;
  if (data.version === undefined) return { ok: false, error: "version 항목이 없습니다." };
  if (data.version !== 1) return { ok: false, error: "지원하지 않는 version입니다. 현재 1만 지원합니다." };
  if (typeof data.title !== "string" || !clean(data.title)) return { ok: false, error: "title은 비어 있지 않은 문자열이어야 합니다." };
  if (!Array.isArray(data.cards) || data.cards.length === 0) return { ok: false, error: "cards는 비어 있지 않은 배열이어야 합니다." };
  if (data.cards.length > 5000) return { ok: false, error: "카드는 최대 5,000개까지 가져올 수 있습니다." };
  const warnings: string[] = [];
  const terms = new Set<string>();
  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i] as RawCard;
    const label = `${i + 1}번째 카드`;
    if (!card || typeof card !== "object" || Array.isArray(card)) return { ok: false, error: `${label}는 객체여야 합니다.` };
    if (typeof card.term !== "string" || !clean(card.term)) return { ok: false, error: `${label}의 term은 비어 있지 않은 문자열이어야 합니다.` };
    if (!Array.isArray(card.meanings) || card.meanings.length === 0 || card.meanings.some((m) => typeof m !== "string" || !clean(m))) return { ok: false, error: `${label}의 meanings는 비어 있지 않은 문자열 배열이어야 합니다.` };
    for (const [key, value] of [["example", card.example], ["exampleMeaning", card.exampleMeaning]] as const) if (value !== undefined && (typeof value !== "string" || !clean(value))) return { ok: false, error: `${label}의 ${key}는 문자열이어야 합니다.` };
    if (card.acceptedAnswers !== undefined && (!Array.isArray(card.acceptedAnswers) || card.acceptedAnswers.some((a) => typeof a !== "string" || !clean(a)))) return { ok: false, error: `${label}의 acceptedAnswers는 문자열 배열이어야 합니다.` };
    const term = normalizeAnswer(card.term);
    if (terms.has(term)) warnings.push(`“${clean(card.term)}” 단어가 여러 번 등장합니다.`);
    terms.add(term);
  }
  return { ok: true, value: { version: 1, title: clean(data.title), description: typeof data.description === "string" ? clean(data.description) : undefined, cards: data.cards as RawCard[] }, warnings };
}

export function makeDeck(input: { version: 1; title: string; description?: string; cards: readonly RawCard[] }, now = new Date()): Deck {
  const iso = now.toISOString();
  const id = crypto.randomUUID();
  return { id, version: 1, title: input.title, description: input.description, sourceCards: input.cards.map((c) => ({ term: clean(c.term as string), meanings: (c.meanings as string[]).map(clean), example: c.example ? clean(c.example as string) : undefined, exampleMeaning: c.exampleMeaning ? clean(c.exampleMeaning as string) : undefined, acceptedAnswers: Array.isArray(c.acceptedAnswers) ? (c.acceptedAnswers as string[]).map(clean) : undefined })), cards: input.cards.map((c) => ({ id: crypto.randomUUID(), term: clean(c.term as string), meanings: (c.meanings as string[]).map(clean), example: c.example ? clean(c.example as string) : undefined, exampleMeaning: c.exampleMeaning ? clean(c.exampleMeaning as string) : undefined, acceptedAnswers: Array.isArray(c.acceptedAnswers) ? (c.acceptedAnswers as string[]).map(clean) : undefined, createdAt: iso, state: "new", reps: 0, lapses: 0 })), createdAt: iso, updatedAt: iso };
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
