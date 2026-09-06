export type Direction = "term-to-meaning" | "meaning-to-term";
export type Theme = "light" | "dark" | "system";

export type Card = {
  id: string;
  term: string;
  meanings: string[];
  example?: string;
  exampleMeaning?: string;
  acceptedAnswers?: string[];
  createdAt: string;
  state: "new" | "learning" | "review";
  dueAt?: string;
  intervalDays?: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
};

export type Deck = {
  id: string;
  version: 1;
  title: string;
  description?: string;
  sourceCards: Array<{ term: string; meanings: string[]; example?: string; exampleMeaning?: string; acceptedAnswers?: string[] }>;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
};

export type StudyEvent = {
  id: string;
  cardId: string;
  deckId: string;
  kind: "quiz" | "review" | "flashcard";
  correct?: boolean;
  rating?: "again" | "hard" | "good" | "easy";
  createdAt: string;
};

export type Settings = { theme: Theme; newCardsPerDay: number; direction: Direction };
export type AppData = { decks: Deck[]; events: StudyEvent[]; settings: Settings };
