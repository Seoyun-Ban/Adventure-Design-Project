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

사진은 `public/images/` 폴더에 넣고 `'/images/파일이름.jpg'` 처럼 경로를 적으면 됩니다. **출처와 라이선스를 꼭 확인**하고 README에 출처를 적어주세요.

## 4. 할 일 목록 (담당자 이름 적고 시작)

기획서 항목별 현황은 `docs/REQUIREMENTS.md` 참고.

### 꼭 필요한 것
- [ ] 학습 글·퀴즈 내용 검토 (사실 확인, 초등학생 눈높이) — `src/data/contents.ts`, `src/data/quizBank.ts` (담당: )
- [ ] 영상 장면 대사 검토 (인물 말투, 사실 확인) — `src/data/figures.ts` (담당: )
- [ ] (선택) Vercel에 `ANTHROPIC_API_KEY` 설정해서 AI 퀴즈 켜기 (담당: )
- [ ] 배포해서 데모 링크 만들기 (Vercel 또는 GitHub Pages) → README에 링크 추가 (담당: )
- [ ] README에 스크린샷, 팀원 이름/역할 채우기 (담당: )

### 있으면 좋은 것
- [ ] 캐릭터 일러스트 고급화 — `src/components/Avatar.tsx`의 도형을 직접 그린 그림(SVG/PNG)으로 교체 (담당: )
- [ ] 3D 배경 다듬기 — `src/three/buildScene.ts` (담당: )
- [ ] 장소 더 추가하기 (이야기책 챕터·아이템과 연결) (담당: )
- [ ] 회원가입, 비밀번호 찾기 화면 (지금은 눌러도 반응 없음) (담당: )

## 5. 시연 팁

- 설정 → '학습 기록 초기화'를 누르면 처음 상태로 돌아갑니다. 발표 전에 한 번 눌러두세요.
- 퀴즈는 3문제 중 2문제 이상 맞혀야 '퀴즈 완료'로 기록되고 복습 퀴즈에 나타납니다.
- 시연 추천 흐름: 먼저 둘러보기 → 아바타 만들기·얼굴 촬영 → 지도에서 불국사 → 학습(영상 장면 재생, 소리 켜기) → 퀴즈 → 학습 완료 → 아바타 탭에서 화랑 예복·검 착용 → 친구와 대결 → 내 정보에서 배지 확인
- 영상 장면 음성은 윈도우 크롬·엣지에서 가장 잘 나와요. 발표 노트북에서 미리 소리를 확인하세요.
- 설정 → '아바타·얼굴 다시 설정'으로 온보딩을 다시 볼 수 있어요.
