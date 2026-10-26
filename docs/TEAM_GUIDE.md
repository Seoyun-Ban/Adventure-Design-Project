# 팀원 작업 가이드

## 1. 처음 받아서 실행하기

1. [Node.js](https://nodejs.org/) (LTS 버전), [Git](https://git-scm.com/), [VS Code](https://code.visualstudio.com/) 설치
2. 저장소 받기
   ```bash
   git clone <저장소 주소>
   cd <저장소 폴더>
   npm install
   npm run dev
   ```
3. 터미널에 나온 `http://localhost:5173` 을 브라우저에서 열기 (F12 → Ctrl+Shift+M 으로 모바일 화면)

## 2. 작업 규칙

- **작업 시작 전에 꼭 `git pull`** 해서 최신 코드 받기
- 기능 하나 끝날 때마다 커밋, 커밋 메시지는 한글로 무엇을 했는지 짧게
  예: `온보딩 화면 추가`, `불국사 사진 추가`
- 같은 파일을 동시에 고치면 충돌이 나기 쉬우니, 아래 할 일 목록에 **담당자 이름을 먼저 적고** 시작하기
- 올리기 전에 `npm run build` 가 에러 없이 끝나는지 확인

```bash
git pull
# ... 작업 ...
git add .
git commit -m "작업 내용"
git push
```

## 3. 코딩 없이 내용만 바꾸는 법

| 바꾸고 싶은 것 | 고칠 파일 |
| --- | --- |
| 학습 글, 퀴즈 문제 | `src/data/contents.ts`, `src/data/quizBank.ts`, `src/data/facts.ts` |
| 영상 장면 대사·인물 | `src/data/figures.ts` |
| 배지 | `src/data/badges.ts` |
| 지도 장소 추가/위치 | `src/data/places.ts` (+ `contents.ts`에 같은 id로 콘텐츠 추가) |
| 이야기책 제목·챕터 | `src/data/storyBooks.ts` |
| 아바타 아이템 | `src/data/avatar.ts` |
| 색상 | `src/index.css` 맨 위 `:root` 변수 |

### 캐릭터 그림 추가하기

학습 영상 장면의 역사 인물 그림은 아래 이름으로 넣으면 자동으로 SVG 캐릭터 대신 그림이 나옵니다. (`src/data/figures.ts`의 `image`)

| 인물 | 파일 이름 | 상태 |
| --- | --- | --- |
| 세종 | `sejong.png` | ✅ |
| 태조 이성계 | `taejo.png` | ✅ |
| 정조 | `jeongjo.png` | ✅ |
| 이순신 | `yisunsin.png` | ✅ |
| 김대성 | `kimdaeseong.png` | ✅ |
| 김구 | `kimgu.png` | ✅ |
| 유관순 | `yugwansun.png` | ✅ |
| 내 캐릭터 남 (짧은 머리/상투) | `me-boy-short.png`, `me-boy-sangtu.png` | ✅ |
| 내 캐릭터 여 (땋은 머리/단발/장발) | `me-girl-braid.png`, `me-girl-bob.png`, `me-girl-long.png` | ✅ |

1. 배경이 **투명한** PNG로 만든다 (전신, 정면, 기존 그림과 비슷한 비율)
2. 원본을 `art/characters/` 폴더에 넣는다
3. 터미널에서 `npm run images` → 여백을 자르고 용량을 줄인 그림이 `public/images/characters/`에 생긴다 (약 1MB → 100KB)
4. `npm run dev`로 확인 후 커밋 (원본과 줄인 그림 둘 다)

내 캐릭터 그림을 바꾸거나 머리 모양을 추가하면 `src/data/avatar.ts`의 `characterStyles`에서 그림 경로, 얼굴 사진 위치(`face`), 아이템 배지 자리(`slots`), 머리·손 아이템 자리(`mounts`)를 그림에 맞게 고쳐야 합니다. 머리 모양을 추가할 때는 `src/types.ts`의 `CharacterStyleId`에도 이름을 더합니다. 성별마다 맨 앞에 적은 머리 모양이 기본값이에요.

### 아이템 그림 넣기

머리·손 아이템은 캐릭터에 직접 입혀집니다. 그림이 없는 아이템(지금은 옷 3종)은 캐릭터 주변에 원형 배지로 보입니다.

| 아이템 | 파일 | 상태 |
| --- | --- | --- |
| 선비의 갓, 장군의 투구 (머리) | `item-gat.png`, `item-helmet.png` | ✅ |
| 정조의 활, 화랑의 검, 학자의 붓 (손) | `item-bow.png`, `item-sword.png`, `item-brush.png` | ✅ |
| 태극기, 독립선언서 (손) | 코드로 그림 (`components/ItemArtView.tsx`, 태극기는 국기 규격대로 `Taegukgi.tsx`) | ✅ |
| 관복, 화랑 예복, 갑옷 (몸) | 없음 → 배지 | ⬜ |

새 아이템 그림 넣는 법:
1. 아이템만 그린 투명 PNG를 `art/characters/item-이름.png`로 넣고 `npm run images`
2. `src/data/avatar.ts`의 그 아이템에 `art`를 적는다
   - `anchor`: 아이템 그림에서 캐릭터에 맞출 점 (모자: 이마에 닿는 아래 테두리, 손 아이템: 쥐는 부분)
   - 모자는 `width`(머리 너비의 몇 배), 손 아이템은 `height`(캐릭터 키의 몇 %)
   - 모자 아래쪽(끈·목가리개)이 얼굴을 가리면 `split`(나눌 높이 %)과 `below`('behind' 뒤에 그리기 / 'hide' 빼기)
3. 캐릭터 그림마다 머리·손 자리는 `characterStyles`의 `mounts`에 있다 (그림을 바꾸면 이 값도 다시 맞춘다)

⚠️ 태극기가 들어간 그림은 꼭 크게 확대해서 확인하세요. AI 그림은 괘 배치나 태극 소용돌이 방향이 틀리는 경우가 많습니다. (`item-flag.png`는 태극 방향이 뒤집혀 있어서 쓰지 않고 코드로 그렸습니다. 원본은 `art/unused/`에 보관 — 이 폴더는 `npm run images`가 처리하지 않아요.)

### 사진

사진은 `public/images/` 폴더에 넣고 `'/images/파일이름.jpg'` 처럼 경로를 적으면 됩니다. **출처와 라이선스를 꼭 확인**하고 README에 출처를 적어주세요.

## 4. 할 일 목록 (담당자 이름 적고 시작)

기획서 항목별 현황은 `docs/REQUIREMENTS.md` 참고.

### 꼭 필요한 것
- [ ] 학습 글·퀴즈 내용 검토 (사실 확인, 초등학생 눈높이) — `src/data/contents.ts`, `src/data/quizBank.ts`, `src/data/facts.ts` (담당: ) — 새로 추가한 **아우내 장터**도 꼭 확인- [ ] 영상 장면 대사 검토 (인물 말투, 사실 확인) — `src/data/figures.ts` (담당: )
- [ ] (선택) Vercel에 `ANTHROPIC_API_KEY` 설정해서 AI 퀴즈 켜기 (담당: )
- [ ] 배포해서 데모 링크 만들기 (Vercel 또는 GitHub Pages) → README에 링크 추가 (담당: )
- [ ] README에 스크린샷, 팀원 이름/역할 채우기 (담당: )

### 있으면 좋은 것
- [ ] 옷 아이템 그림 만들기 (관복, 화랑 예복, 갑옷 — 지금은 배지) (위 '아이템 그림 넣기' 참고) (담당: )
- [ ] 3D 배경 다듬기 — `src/three/buildScene.ts` (담당: )
- [ ] 장소 더 추가하기 (이야기책 챕터·아이템과 연결) (담당: )
- [x] 회원가입, 비밀번호 찾기 화면 (화면과 흐름만, 약관은 예시 문구 — 실제 서비스 전에 정식 약관으로 교체)

## 5. 시연 팁

- 설정 → '학습 기록 초기화'를 누르면 처음 상태로 돌아갑니다. 발표 전에 한 번 눌러두세요.
- 퀴즈는 3문제 중 2문제 이상 맞혀야 '퀴즈 완료'로 기록되고 복습 퀴즈에 나타납니다.
- 시연 추천 흐름: 먼저 둘러보기 → 아바타 만들기·얼굴 촬영 → 지도에서 불국사 → 학습(영상 장면 재생, 소리 켜기) → 퀴즈 → 학습 완료 → 아바타 탭에서 화랑 예복·검 착용 → 친구와 대결 → 내 정보에서 배지 확인
- 영상 장면 음성은 윈도우 크롬·엣지에서 가장 잘 나와요. 발표 노트북에서 미리 소리를 확인하세요.
- 설정 → '아바타·얼굴 다시 설정'으로 온보딩을 다시 볼 수 있어요.
