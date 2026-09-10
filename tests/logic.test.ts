import { describe, expect, it } from "vitest";
import { answerIsCorrect, assessmentAnswerIsCorrect, buildAssessmentSession, buildFullAssessmentSession, buildMatchingPuzzle, buildRivalQuestion, makeDeck, nextSchedule, quizChoices, reviewQueue, updateMastery, validateImport, weakAssessmentItems, wrongAssessmentItems, uncertainAssessmentItems } from "../lib/logic";

const input = { version: 1 as const, title: "테스트", cards: [{ term: "tweak", meanings: ["살짝 조정하다"], acceptedAnswers: ["조금 수정하다"] }, { term: "inactive", meanings: ["활동하지 않는"] }, { term: "retain", meanings: ["유지하다"] }, { term: "coherent", meanings: ["일관성 있는"] }] };

describe("JSON contract", () => {
  it("validates and trims a valid deck", () => {
    const result = validateImport({ version: 1, title: "  테스트 ", cards: [{ term: " word ", meanings: [" 뜻 "] }] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.title).toBe("테스트");
  });
  it("explains card position for invalid meanings", () => {
    const result = validateImport({ version: 1, title: "테스트", cards: [{ term: "one", meanings: [] }] });
    expect(result).toEqual({ ok: false, error: "1번째 카드의 meanings는 비어 있지 않은 문자열 배열이어야 합니다." });
  });
});

describe("answer and quiz logic", () => {
  it("accepts exact normalized answers, not loose substrings", () => {
    const deck = makeDeck(input, new Date("2026-01-01T00:00:00Z"));
    const card = deck.cards[0];
    expect(answerIsCorrect(card, "  조금   수정하다 ", "term-to-meaning")).toBe(true);
    expect(answerIsCorrect(card, "조정", "term-to-meaning")).toBe(false);
    expect(answerIsCorrect(card, " TWEAK ", "meaning-to-term")).toBe(true);
  });
  it("does not include duplicate or conflicting multiple-choice answers", () => {
    const deck = makeDeck(input);
    const choices = quizChoices(deck.cards[0], deck, "term-to-meaning");
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((choice) => choice.toLocaleLowerCase())).size).toBe(4);
    expect(choices).not.toContain("조금 수정하다");
  });
});

describe("review scheduling", () => {
  it("uses rating-specific future intervals", () => {
    const deck = makeDeck(input, new Date("2026-01-01T00:00:00Z"));
    const card = deck.cards[0];
    expect(nextSchedule(card, "again", new Date("2026-01-01T00:00:00Z")).dueAt).toBe("2026-01-01T00:10:00.000Z");
    expect(nextSchedule({ ...card, intervalDays: 2 }, "good", new Date("2026-01-01T00:00:00Z")).dueAt).toBe("2026-01-06T00:00:00.000Z");
  });
  it("keeps new-card limit separate from due cards", () => {
    const deck = makeDeck(input);
    const due = { ...deck.cards[0], state: "learning" as const, dueAt: "2025-12-31T00:00:00Z" };
    const queue = reviewQueue({ ...deck, cards: [due, ...deck.cards.slice(1)] }, [], 2, new Date("2026-01-01T00:00:00Z"));
    expect(queue[0].id).toBe(due.id);
    expect(queue).toHaveLength(3);
  });
});

const assessmentInput = {
  version: 1 as const,
  title: "수행평가 fixture",
  assessment: { confusionGroups: [{ id: "cause-action", terms: ["prompt", "induce", "lead", "guide"] }] },
  cards: [
    { id: "recall-1", term: "neutralize", meanings: ["중화하다"], assessment: { items: [{ id: "recall-1-item", type: "recall" as const, prompt: "중화하다", answer: "neutralize" }] } },
    { id: "blank-1", term: "compel", meanings: ["강요하다"], assessment: { items: [{ id: "blank-1-item", type: "blank" as const, prompt: "Many people feel ___ to act.", answer: "compelled", rule: "feel compelled to" }] } },
    { id: "rival-1", term: "prompt", meanings: ["촉구하다"], assessment: { items: [{ id: "rival-1-item", type: "rival" as const, prompt: "The illusion ___ drivers to brake.", answer: "prompted", acceptedAnswers: ["prompt"], confusionGroupId: "cause-action", anchors: ["illusion → prompt → brakes"] }] } },
    { id: "rival-2", term: "induce", meanings: ["유도하다"], assessment: { items: [{ id: "rival-2-item", type: "rival" as const, prompt: "Nudging can ___ better decisions.", answer: "induce", confusionGroupId: "cause-action" }] } },
    { id: "rival-3", term: "lead", meanings: ["이끌다"], assessment: { items: [{ id: "rival-3-item", type: "rival" as const, prompt: "Choices can ___ one to act.", answer: "lead", confusionGroupId: "cause-action" }] } },
    { id: "rival-4", term: "guide", meanings: ["안내하다"], assessment: { items: [{ id: "rival-4-item", type: "rival" as const, prompt: "A nudge can ___ individuals.", answer: "guide", confusionGroupId: "cause-action" }] } },
    { id: "match-1", term: "option", meanings: ["선택지"], assessment: { items: [{ id: "match-1-item", type: "match" as const, prompt: "an ___", answer: "option", confusionGroupId: "cause-action" }] } },
    { id: "match-2", term: "default", meanings: ["기본값"], assessment: { items: [{ id: "match-2-item", type: "match" as const, prompt: "the ___ setting", answer: "default", confusionGroupId: "cause-action" }] } },
    { id: "match-3", term: "reduce", meanings: ["줄이다"], assessment: { items: [{ id: "match-3-item", type: "match" as const, prompt: "___ their use", answer: "reduce", confusionGroupId: "cause-action" }] } },
    { id: "match-4", term: "establish", meanings: ["확립하다"], assessment: { items: [{ id: "match-4-item", type: "match" as const, prompt: "___ A as B", answer: "establish", confusionGroupId: "cause-action" }] } },
  ],
};

describe("assessment mode", () => {
  it("preserves assessment metadata through import and deck creation", () => {
    const result = validateImport(assessmentInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const deck = makeDeck(result.value, new Date("2026-01-01T00:00:00Z"));
      expect(deck.cards.find((card) => card.sourceId === "blank-1")?.assessment?.items?.[0].answer).toBe("compelled");
      expect(deck.sourceCards.find((card) => card.id === "rival-1")?.assessment?.items?.[0].id).toBe("rival-1-item");
    }
  });
  it("builds a mixed queue with the target proportions and no immediate duplicate", () => {
    const result = validateImport(assessmentInput);
    if (!result.ok) throw new Error(result.error);
    const deck = makeDeck(result.value);
    const queue = buildAssessmentSession(deck, [], 11, 10);
    const counts = queue.reduce<Record<string, number>>((all, question) => { all[question.type] = (all[question.type] ?? 0) + 1; return all; }, {});
    expect(queue.length).toBeGreaterThanOrEqual(8);
    expect(counts.recall + counts.blank).toBeGreaterThanOrEqual(Math.floor(queue.length * 0.5));
    expect(counts.rival).toBeGreaterThanOrEqual(Math.floor(queue.length * 0.2));
    expect(counts.match).toBeGreaterThanOrEqual(Math.floor(queue.length * 0.1));
    expect(queue.every((question, index) => index === 0 || question.itemId !== queue[index - 1].itemId)).toBe(true);
  });
  it("builds all 154 cards as one randomized direct-typing run", () => {
    const source = {
      version: 1 as const,
      title: "154 typing fixture",
      cards: Array.from({ length: 154 }, (_, index) => ({
        id: `card-${index + 1}`,
        term: `term-${index + 1}`,
        meanings: [`meaning-${index + 1}`],
        acceptedAnswers: [`뜻-${index + 1}`],
        assessment: { items: [{ id: `item-${index + 1}`, type: "blank" as const, prompt: `Sentence ${index + 1} ___ .`, answer: `answer-${index + 1}`, acceptedAnswers: [`answer-${index + 1}`] }] },
      })),
    };
    const result = validateImport(source);
    if (!result.ok) throw new Error(result.error);
    const deck = makeDeck(result.value);
    const first = buildFullAssessmentSession(deck, 101);
    const sameSeed = buildFullAssessmentSession(deck, 101);
    const otherSeed = buildFullAssessmentSession(deck, 202);
    expect(first).toHaveLength(154);
    expect(new Set(first.map((question) => question.itemId)).size).toBe(154);
    expect(first.every((question) => question.type === "blank")).toBe(true);
    expect(first.map((question) => question.itemId)).toEqual(sameSeed.map((question) => question.itemId));
    expect(first.map((question) => question.itemId)).not.toEqual(otherSeed.map((question) => question.itemId));
    expect(first.some((question) => question.acceptedAnswers.some((answer) => answer.startsWith("뜻-")))).toBe(false);
    expect(buildAssessmentSession(deck, [], 303, 154)).toHaveLength(154);
  });
  it("checks blank, rival and accepted form answers strictly", () => {
    const result = validateImport(assessmentInput);
    if (!result.ok) throw new Error(result.error);
    const deck = makeDeck(result.value);
    const blank = deck.cards.find((card) => card.sourceId === "blank-1")!.assessment!.items![0];
    const rival = deck.cards.find((card) => card.sourceId === "rival-1")!.assessment!.items![0];
    expect(assessmentAnswerIsCorrect({ id: "blank", itemId: blank.id, type: "blank", cardId: "", prompt: blank.prompt, answer: blank.answer, acceptedAnswers: [] }, " COMPELLED ")).toBe(true);
    expect(assessmentAnswerIsCorrect(buildRivalQuestion(deck, rival), "prompt")).toBe(true);
    expect(assessmentAnswerIsCorrect(buildRivalQuestion(deck, rival), "induce")).toBe(false);
  });
  it("creates a one-use 4x4 matching puzzle", () => {
    const result = validateImport(assessmentInput);
    if (!result.ok) throw new Error(result.error);
    const deck = makeDeck(result.value);
    const items = deck.cards.flatMap((card) => card.assessment?.items ?? []).filter((item) => item.type === "match");
    const puzzle = buildMatchingPuzzle(deck, items);
    expect(puzzle?.matchPairs).toHaveLength(4);
    expect(new Set(puzzle?.options).size).toBe(4);
  });
  it("prioritizes and separates wrong from uncertain items", () => {
    const result = validateImport(assessmentInput);
    if (!result.ok) throw new Error(result.error);
    const deck = makeDeck(result.value);
    const now = new Date("2026-01-02T00:00:00.000Z");
    const wrong = { id: "event-w", deckId: deck.id, cardId: "", kind: "assessment" as const, assessmentItemId: "rival-1-item", assessmentType: "rival" as const, correct: false, uncertain: false, createdAt: "2026-01-01T00:00:00.000Z" };
    const held = { ...wrong, id: "event-h", assessmentItemId: "rival-2-item", correct: false, uncertain: true };
    expect(wrongAssessmentItems(deck, [wrong]).map((item) => item.id)).toEqual(["rival-1-item"]);
    expect(uncertainAssessmentItems(deck, [held]).map((item) => item.id)).toEqual(["rival-2-item"]);
    expect(weakAssessmentItems(deck, [wrong], now)[0].id).toBe("rival-1-item");
    expect(updateMastery(50, false, false, 5000)).toBe(30);
  });
});
