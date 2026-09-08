export const sampleJson = {
  version: 1,
  title: "수능 영어 Day 1",
  description: "오늘 외울 단어",
  assessment: {
    anchors: ["본문 속 자리 지문", "형태 변형"],
    confusionGroups: [{ id: "cause-action", terms: ["prompt", "induce", "lead", "guide"] }],
  },
  cards: [
    { id: "day1-inactive", term: "inactive", meanings: ["활동하지 않는", "비활성의"], example: "The device becomes inactive after ten minutes.", exampleMeaning: "그 기기는 10분 후 비활성 상태가 된다.", assessment: { items: [{ id: "inactive-recall", type: "recall", prompt: "활동하지 않는, 비활성의", answer: "inactive" }] } },
    { id: "day1-tweak", term: "tweak", meanings: ["살짝 조정하다"], acceptedAnswers: ["조금 수정하다"], assessment: { items: [{ id: "tweak-recall", type: "recall", prompt: "살짝 조정하다", answer: "tweak", acceptedAnswers: ["조금 수정하다"] }] } },
    { id: "day1-in-turn", term: "in turn", meanings: ["그에 이어", "차례로"], assessment: { items: [{ id: "turn-blank", type: "blank", prompt: "The teams responded ___ .", answer: "in turn" }] } },
    { id: "day1-coherent", term: "coherent", meanings: ["일관성 있는", "논리 정연한"], example: "She gave a coherent explanation.", exampleMeaning: "그녀는 논리 정연한 설명을 했다.", assessment: { items: [{ id: "coherent-blank", type: "blank", prompt: "She gave a ___ explanation.", answer: "coherent", rule: "a + adjective + noun" }] } },
    { id: "day1-retain", term: "retain", meanings: ["유지하다", "기억하다"], assessment: { items: [{ id: "retain-recall", type: "recall", prompt: "유지하다, 기억하다", answer: "retain" }] } },
    { id: "day1-prompt", term: "prompt", meanings: ["촉구하다", "자극하다"], assessment: { items: [{ id: "prompt-rival", type: "rival", prompt: "The illusion ___ drivers to step on the brakes.", answer: "prompted", acceptedAnswers: ["prompt"], anchors: ["illusion → prompt → brakes"], rule: "prompt A to V", confusionGroupId: "cause-action" }] } },
    { id: "day1-induce", term: "induce", meanings: ["유도하다"], assessment: { items: [{ id: "induce-rival", type: "rival", prompt: "Nudging can be applied to ___ people to make better decisions.", answer: "induce", anchors: ["nudging → induce → better decisions"], rule: "induce A to V", confusionGroupId: "cause-action" }] } },
    { id: "day1-lead", term: "lead", meanings: ["이끌다"], assessment: { items: [{ id: "lead-rival", type: "rival", prompt: "Highlighting right decisions can ___ one to do the right thing.", answer: "lead", anchors: ["right decisions → lead → right thing"], rule: "lead A to V", confusionGroupId: "cause-action" }] } },
    { id: "day1-guide", term: "guide", meanings: ["안내하다"], assessment: { items: [{ id: "guide-rival", type: "rival", prompt: "A nudge gently ___ individuals toward a desired action.", answer: "guide", anchors: ["gently guide individuals → toward desired action"], rule: "guide A toward B", confusionGroupId: "cause-action" }] } },
    { id: "day1-match-1", term: "neutralize", meanings: ["중화하다"], assessment: { items: [{ id: "match-neutralize", type: "match", prompt: "A smiley face can ___ the opposite effect.", answer: "neutralize", confusionGroupId: "cause-action" }] } },
    { id: "day1-match-2", term: "consume", meanings: ["소비하다"], assessment: { items: [{ id: "match-consume", type: "match", prompt: "Students ___ less energy.", answer: "consume", confusionGroupId: "cause-action" }] } },
    { id: "day1-match-3", term: "reduce", meanings: ["줄이다"], assessment: { items: [{ id: "match-reduce", type: "match", prompt: "The policy will ___ crashes.", answer: "reduce", confusionGroupId: "cause-action" }] } },
    { id: "day1-match-4", term: "establish", meanings: ["확립하다"], assessment: { items: [{ id: "match-establish", type: "match", prompt: "The school will ___ a new default.", answer: "establish", confusionGroupId: "cause-action" }] } },
  ],
} as const;
