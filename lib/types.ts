export type Direction = "term-to-meaning" | "meaning-to-term";
export type Theme = "light" | "dark" | "system";

export type AssessmentItemType = "recall" | "blank" | "rival" | "match";

export type AssessmentItem = {
  id: string;
  type: AssessmentItemType;
  prompt: string;
  answer: string;
  acceptedAnswers?: readonly string[];
  anchors?: readonly string[];
  rule?: string;
  confusionGroupId?: string;
};

export type ConfusionGroup = { id: string; terms: readonly string[] };
export type AssessmentMeta = {
  anchors?: readonly string[];
  confusionGroups?: ReadonlyArray<string | ConfusionGroup>;
  items?: readonly AssessmentItem[];
};

export type Card = {
  id: string;
  sourceId?: string;
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
  assessment?: AssessmentMeta;
};

export type Deck = {
  id: string;
  version: 1;
  title: string;
  description?: string;
  sourceCards: Array<{ id?: string; term: string; meanings: string[]; example?: string; exampleMeaning?: string; acceptedAnswers?: string[]; assessment?: AssessmentMeta }>;
  cards: Card[];
  assessment?: AssessmentMeta;
  createdAt: string;
  updatedAt: string;
};

export type StudyEvent = {
  id: string;
  cardId: string;
  deckId: string;
  kind: "quiz" | "review" | "flashcard" | "assessment";
  correct?: boolean;
  rating?: "again" | "hard" | "good" | "easy";
  sessionId?: string;
  assessmentItemId?: string;
  assessmentType?: AssessmentItemType;
  userAnswer?: string;
  expectedAnswer?: string;
  uncertain?: boolean;
  confusionGroupId?: string;
  formRule?: string;
  responseMs?: number;
  mastery?: number;
  createdAt: string;
};

export type Settings = { theme: Theme; newCardsPerDay: number; direction: Direction };
export type AppData = { decks: Deck[]; events: StudyEvent[]; settings: Settings };
