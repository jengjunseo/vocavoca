# 단어틈

JSON으로 시작해 플래시카드, 퀴즈, 간격 반복 복습을 이어가는 모바일 중심 영어 단어장입니다. 로그인이나 서버 저장 없이 브라우저의 IndexedDB에 단어장·카드 상태·학습 이벤트·설정을 저장합니다.

## 실행

```bash
npm install
npm run dev
```

프로덕션 확인은 `npm run build && npm run start`로 합니다.

## JSON 규격

최상위 필수 값은 `version: 1`, `title`, `cards`입니다. 카드에는 `term`, 비어 있지 않은 문자열 배열 `meanings`가 필요합니다. `description`, `example`, `exampleMeaning`, `acceptedAnswers`는 선택 값입니다. 파일은 2MB 이하, 카드는 5,000개 이하입니다. 필수 문자열은 앞뒤 공백이 제거되며, 중복 term은 경고 후 보존됩니다.

```json
{
  "version": 1,
  "title": "수능 영어 Day 1",
  "description": "오늘 외울 단어",
  "cards": [
    {
      "term": "inactive",
      "meanings": ["활동하지 않는", "비활성의"],
      "example": "The device becomes inactive after ten minutes.",
      "exampleMeaning": "그 기기는 10분 후 비활성 상태가 된다."
    }
  ]
}
```

`public/sample-deck.json`은 앱 도움말에서 안내하는 샘플입니다. 가져오기 오류는 기존 데이터를 건드리지 않고 카드 위치를 포함해 설명합니다.

## 복습 알고리즘

오늘의 복습은 due 시각이 지난 기존 학습 카드를 먼저 넣고, 하루 새 카드 한도만큼 새 카드를 뒤에 추가합니다. 정답 공개 뒤 `다시`는 10분, `어려움`은 현재 간격의 1.4배, `보통`은 2.4배, `쉬움`은 3.8배로 다음 시각을 계산합니다. 최소 간격은 보통 1일, 쉬움 2일이고 21일 이상이면 review 상태가 됩니다. 일반 플래시카드 탐색은 복습 일정을 바꾸지 않습니다.

퀴즈 통계는 `quiz` 이벤트만 집계하고, 플래시카드와 자기평가 복습은 정답률에 섞지 않습니다. 답 비교는 Unicode NFC 정규화, 앞뒤 공백 제거, 연속 공백 축약, 영문 대소문자 무시를 적용하며 부분 문자열은 인정하지 않습니다.

## 백업과 배포

설정에서 버전이 있는 `daneoteum-backup` 포맷으로 전체 데이터를 내려받고, 검증·확인 후 한 번에 복원할 수 있습니다. 원본 JSON 내보내기는 단어장 상세에서 별도로 제공합니다.

```bash
npm run test
npm run build
npx vercel --prod
```

Vercel 배포에는 별도 환경변수가 필요하지 않습니다. 사용자 데이터는 서버로 전송되지 않습니다.
