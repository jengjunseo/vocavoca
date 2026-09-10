import fs from "node:fs";

function swap(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Patch target not found: ${label}`);
  return source.replace(needle, replacement);
}

// lib/logic.ts: identify real morphology changes and build a strict direct-typing queue.
{
  const path = "lib/logic.ts";
  let s = fs.readFileSync(path, "utf8");

  s = swap(s,
    "  acceptedAnswers: string[];\n  anchors?: string[];",
    "  acceptedAnswers: string[];\n  baseTerm?: string;\n  anchors?: string[];",
    "AssessmentQuestion.baseTerm");

  s = swap(s,
    "export function uncertainAssessmentItems(deck: Deck, events: StudyEvent[]) { const ids = new Set(events.filter((event) => event.kind === \"assessment\" && event.uncertain).map((event) => event.assessmentItemId)); return assessmentItems(deck).filter((item) => ids.has(item.id)); }\n\nfunction questionFromItem",
    "export function uncertainAssessmentItems(deck: Deck, events: StudyEvent[]) { const ids = new Set(events.filter((event) => event.kind === \"assessment\" && event.uncertain).map((event) => event.assessmentItemId)); return assessmentItems(deck).filter((item) => ids.has(item.id)); }\n\nexport function formAssessmentItems(deck: Deck) {\n  return assessmentItems(deck).filter((item) => {\n    if (item.type === \"match\") return false;\n    const card = itemCard(deck, item);\n    return Boolean(card?.term) && normalizeAnswer(item.answer) !== normalizeAnswer(card.term);\n  });\n}\n\nfunction questionFromItem",
    "formAssessmentItems");

  s = swap(s,
    "  return shuffled;\n}\n\nexport function assessmentAnswerIsCorrect",
    "  return shuffled;\n}\n\nexport function buildFormAssessmentSession(deck: Deck, seed = 7) {\n  const questions = formAssessmentItems(deck).map((item) => {\n    const card = itemCard(deck, item);\n    const question = questionFromItem(deck, item, \"blank\");\n    return {\n      ...question,\n      id: `${item.id}-form`,\n      type: \"blank\" as const,\n      baseTerm: card?.term ?? \"\",\n      acceptedAnswers: [...(item.acceptedAnswers ?? [])],\n    };\n  });\n  return seededShuffle(questions, seed);\n}\n\nexport function assessmentAnswerIsCorrect",
    "buildFormAssessmentSession");

  fs.writeFileSync(path, s);
}

// app/page.tsx: add a first-class morphology mode. The source word is visible;
// the imported assessment prompt supplies the paraphrased summary context.
{
  const path = "app/page.tsx";
  let s = fs.readFileSync(path, "utf8");

  s = swap(s, "assessmentItems, buildAssessmentSession,", "assessmentItems, buildAssessmentSession, buildFormAssessmentSession,", "import form builder");
  s = swap(s, "dueCards, hasAssessmentData,", "dueCards, formAssessmentItems, hasAssessmentData,", "import form items");
  s = swap(s, "type LearnMode = \"flashcard\" | \"quiz\" | \"review\" | \"assessment\";", "type LearnMode = \"flashcard\" | \"quiz\" | \"review\" | \"assessment\" | \"forms\";", "LearnMode forms");

  s = swap(s,
    "const deck = data.decks.find((candidate) => hasAssessmentData(candidate));",
    "const deck = data.decks.find((candidate) => launch === \"forms\" ? formAssessmentItems(candidate).length > 0 : hasAssessmentData(candidate));",
    "stats deck selection");

  s = swap(s,
    "const assessmentReady = Boolean(deck && hasAssessmentData(deck)); const choices =",
    "const assessmentReady = Boolean(deck && hasAssessmentData(deck)); const formCount = deck ? formAssessmentItems(deck).length : 0; const formReady = formCount > 0; const choices =",
    "form readiness");

  s = swap(s,
    "chosenMode === \"assessment\" ? [] : [...deck.cards]",
    "(chosenMode === \"assessment\" || chosenMode === \"forms\") ? [] : [...deck.cards]",
    "begin forms");

  s = swap(s,
    "if (mode === \"assessment\" && started) return <AssessmentSession data={data} deck={deck} launch={initialAssessmentLaunch} onExit={() => { setStarted(false); setFinished(false); }} onSave={onSave} />;",
    "if ((mode === \"assessment\" || mode === \"forms\") && started) return <AssessmentSession data={data} deck={deck} launch={mode === \"forms\" ? \"forms\" : initialAssessmentLaunch} onExit={() => { setStarted(false); setFinished(false); }} onSave={onSave} />;",
    "render forms");

  const assessmentCard = "<ModeCard active={mode === \"assessment\"} disabled={!assessmentReady} icon={<Target />} title=\"수행평가 100점\" description={assessmentReady ? `${deck.cards.length}문제 · 랜덤 직접입력` : \"assessment JSON을 가져오면 사용할 수 있어요\"} onClick={() => assessmentReady && setMode(\"assessment\")} />";
  s = swap(s, assessmentCard,
    assessmentCard + "<ModeCard active={mode === \"forms\"} disabled={!formReady} icon={<Shuffle />} title=\"어형변화 특훈\" description={formReady ? `${formCount}문제 · 제시어 보고 변형만 직접입력` : \"변형형 정답이 있는 assessment 문항이 필요해요\"} onClick={() => formReady && setMode(\"forms\")} />",
    "forms mode card");

  s = swap(s,
    "disabled={mode === \"assessment\" && !assessmentReady}",
    "disabled={(mode === \"assessment\" && !assessmentReady) || (mode === \"forms\" && !formReady)}",
    "forms start disabled");

  s = swap(s,
    "{mode === \"review\" ? \"복습 시작\" : mode === \"assessment\" ? `${deck.cards.length}문제 시작` : \"학습 시작\"}",
    "{mode === \"review\" ? \"복습 시작\" : mode === \"assessment\" ? `${deck.cards.length}문제 시작` : mode === \"forms\" ? `${formCount}문제 시작` : \"학습 시작\"}",
    "forms start label");

  s = swap(s,
    "  const [sessionId] = useState(() => crypto.randomUUID());\n  const [fullRun, setFullRun] = useState(!launch);",
    "  const [sessionId] = useState(() => crypto.randomUUID());\n  const formMode = launch === \"forms\";\n  const [fullRun, setFullRun] = useState(!launch || formMode);",
    "formMode flag");

  s = swap(s,
    "const launchItems = launch === \"wrong\" ? wrongAssessmentItems(deck, data.events) : launch === \"uncertain\" ? uncertainAssessmentItems(deck, data.events) : launch === \"forms\" ? assessmentItems(deck).filter((item) => item.type === \"blank\") : null;",
    "const launchItems = launch === \"wrong\" ? wrongAssessmentItems(deck, data.events) : launch === \"uncertain\" ? uncertainAssessmentItems(deck, data.events) : formMode ? formAssessmentItems(deck) : null;",
    "form launch items");

  s = swap(s,
    "const [queue, setQueue] = useState<AssessmentQuestion[]>(() => buildAssessmentSession(deck, launchEvents, Math.floor(Math.random() * 0x7fffffff) || 1, launch ? 12 : deck.cards.length));",
    "const [queue, setQueue] = useState<AssessmentQuestion[]>(() => { const seed = Math.floor(Math.random() * 0x7fffffff) || 1; return formMode ? buildFormAssessmentSession(deck, seed) : buildAssessmentSession(deck, launchEvents, seed, launch ? 12 : deck.cards.length); });",
    "form queue");

  s = swap(s, "const [duration, setDuration] = useState(launch === \"wrong\" ? 180 : launch ? 600 : 0);", "const [duration, setDuration] = useState(launch === \"wrong\" ? 180 : launch && !formMode ? 600 : 0);", "form duration");
  s = swap(s, "const [remaining, setRemaining] = useState(launch === \"wrong\" ? 180 : launch ? 600 : 0);", "const [remaining, setRemaining] = useState(launch === \"wrong\" ? 180 : launch && !formMode ? 600 : 0);", "form remaining");

  s = swap(s,
    "const label = question?.type === \"rival\" ? \"경쟁자 · 자리\" : question?.type === \"match\" ? \"자리 매칭\" : question?.type === \"blank\" ? \"실전 직접입력\" : \"리콜\";",
    "const label = formMode ? \"어형변화 특훈\" : question?.type === \"rival\" ? \"경쟁자 · 자리\" : question?.type === \"match\" ? \"자리 매칭\" : question?.type === \"blank\" ? \"실전 직접입력\" : \"리콜\";",
    "form label");

  s = swap(s,
    "<span>수행평가 100점</span></div><div className=\"result-card\">",
    "<span>{formMode ? \"어형변화 특훈\" : \"수행평가 100점\"}</span></div><div className=\"result-card\">",
    "form result title");

  s = swap(s,
    "<span className=\"eyebrow\">{label}</span>{question.confusionGroupId && <span className=\"group-chip\">{question.confusionGroupId}</span>}",
    "<span className=\"eyebrow\">{label}</span>{formMode && question.baseTerm ? <span className=\"group-chip\">제시어 · {question.baseTerm}</span> : question.confusionGroupId ? <span className=\"group-chip\">{question.confusionGroupId}</span> : null}",
    "base term chip");

  s = swap(s,
    "placeholder={question.type === \"blank\" ? \"문장에 맞는 형태를 입력하세요\" : \"정답을 입력하세요\"}",
    "placeholder={formMode ? \"제시어를 문장에 맞게 변형하세요\" : question.type === \"blank\" ? \"문장에 맞는 형태를 입력하세요\" : \"정답을 입력하세요\"}",
    "form placeholder");

  s = swap(s,
    "<button className=\"secondary-button\" onClick={() => onAssessment(\"forms\")}>형태변형만</button>",
    "<button className=\"secondary-button\" onClick={() => onAssessment(\"forms\")}>어형변화 특훈</button>",
    "stats form label");

  fs.writeFileSync(path, s);
}

// tests/logic.test.ts
{
  const path = "tests/logic.test.ts";
  let s = fs.readFileSync(path, "utf8");
  s = swap(s,
    "buildAssessmentSession, buildFullAssessmentSession, buildMatchingPuzzle",
    "buildAssessmentSession, buildFormAssessmentSession, buildFullAssessmentSession, buildMatchingPuzzle",
    "test import form builder");
  s = swap(s,
    "buildRivalQuestion, makeDeck, nextSchedule",
    "buildRivalQuestion, formAssessmentItems, makeDeck, nextSchedule",
    "test import form items");

  s += `\n\ndescribe("form-change drill", () => {\n  it("uses only items whose required answer differs from the provided base term", () => {\n    const result = validateImport(assessmentInput);\n    if (!result.ok) throw new Error(result.error);\n    const deck = makeDeck(result.value);\n    expect(formAssessmentItems(deck).map((item) => item.id).sort()).toEqual(["blank-1-item", "rival-1-item"]);\n  });\n\n  it("builds the entire morphology queue as strict direct typing with the base term exposed", () => {\n    const result = validateImport(assessmentInput);\n    if (!result.ok) throw new Error(result.error);\n    const deck = makeDeck(result.value);\n    const first = buildFormAssessmentSession(deck, 17);\n    const second = buildFormAssessmentSession(deck, 17);\n    expect(first).toHaveLength(2);\n    expect(first.map((question) => question.itemId)).toEqual(second.map((question) => question.itemId));\n    expect(first.every((question) => question.type === "blank" && Boolean(question.baseTerm))).toBe(true);\n    expect(new Set(first.map((question) => question.itemId)).size).toBe(first.length);\n  });\n\n  it("accepts the requested inflected form but not the base word or Korean meaning alias", () => {\n    const result = validateImport(assessmentInput);\n    if (!result.ok) throw new Error(result.error);\n    const deck = makeDeck(result.value);\n    const question = buildFormAssessmentSession(deck, 17).find((candidate) => candidate.itemId === "blank-1-item");\n    if (!question) throw new Error("missing form question");\n    expect(question.baseTerm).toBe("compel");\n    expect(assessmentAnswerIsCorrect(question, "compelled")).toBe(true);\n    expect(assessmentAnswerIsCorrect(question, "compel")).toBe(false);\n    expect(assessmentAnswerIsCorrect(question, "강요하다")).toBe(false);\n  });\n});\n`;
  fs.writeFileSync(path, s);
}

console.log("Form drill patch applied.");
