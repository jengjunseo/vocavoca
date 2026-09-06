export const sampleJson = {
  version: 1,
  title: "수능 영어 Day 1",
  description: "오늘 외울 단어",
  cards: [
    { term: "inactive", meanings: ["활동하지 않는", "비활성의"], example: "The device becomes inactive after ten minutes.", exampleMeaning: "그 기기는 10분 후 비활성 상태가 된다." },
    { term: "tweak", meanings: ["살짝 조정하다"], acceptedAnswers: ["조금 수정하다"] },
    { term: "in turn", meanings: ["그에 이어", "차례로"] },
    { term: "coherent", meanings: ["일관성 있는", "논리 정연한"], example: "She gave a coherent explanation.", exampleMeaning: "그녀는 논리 정연한 설명을 했다." },
    { term: "retain", meanings: ["유지하다", "기억하다"] },
  ],
} as const;
