import { describe, expect, it } from "vitest";
import { answerIsCorrect, makeDeck, nextSchedule, quizChoices, reviewQueue, validateImport } from "../lib/logic";

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
