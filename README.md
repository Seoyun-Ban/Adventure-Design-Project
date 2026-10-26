# 역사 한걸음

> 걸어서 만나는 우리 역사 — 역사 유적지를 직접 방문하고 학습하면 지도에 **발자국**이 남는 위치 기반 역사 학습 앱

충남대학교 어드벤처디자인 팀 프로젝트 프로토타입입니다.

- 🔗 데모: (배포 후 링크 추가)
- 📄 기획서: `docs/` 참고

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 지도 | 남한 지도 위에 현재 위치, 발자국(학습 완료), 학습 가능한 장소 표시. 드래그·핀치·휠로 이동/확대, 현재 위치로 이동 |
| 역사 학습 | 장소별 3D 배경, 쉬움/보통/어려움 3단계 학습 글, 관심 장소 등록 |
| 학습 영상 장면 | 장소에 맞는 3D 배경에서 역사 인물과 내 캐릭터(등록한 얼굴)가 대화. 일러스트 캐릭터, 말할 때 움직임, 인물별 음성(TTS) + 국악풍 배경 음악 |
| 퀴즈 | 학습 단계와 같은 난이도. AI(Claude API) 출제 또는 기기 안 자동 생성으로 매번 다른 문제 |
| 복습 퀴즈 | 틀린 문제를 자동으로 모아 먼저 다시 출제, 맞히면 목록에서 빠짐 |
| 이야기책 | 주제별 책 모양 책장, 전체 권 수 대비 발견한 책, 책마다 읽은 이야기 진행률, 키워드 검색 |
| 아바타 | 첫 이용 시 닉네임·성별·머리 모양·얼굴 등록, 일러스트 캐릭터, 학습으로 역사 아이템 수집, 머리·손 아이템은 캐릭터에 직접 입히고, 옷은 아직 배지로 표시 |
| 친구와 대결 | 무작위 문제, 맞히면 공격/방어 선택, 턴제. 전투력 = 아이템 능력치 + 레벨 보너스. 승패 모션, 다시 도전, 대결 기록(승률·최근 5판) |
| 도전장 링크 | 서버 없이 내 아바타(닉네임·외형·아이템·레벨, 얼굴 사진 제외)를 링크에 담아 친구에게 공유 → 받은 친구가 그 아바타와 대결, 답장 도전장 |
| 내 정보 | 획득한 배지, 관심 장소, 이번 주 탐험, 닉네임 바꾸기 |
| 도움말 | 메뉴에서 앱 사용법과 자주 묻는 질문을 초등학생 눈높이로 안내, 문의하기·내 문의 내역 (기기에만 저장, 화면과 흐름만) |
| 로그인·회원가입 | 간편 로그인(공식 아이콘), 이메일 로그인, 회원가입(약관 동의, 태어난 해·달로 만 14세 미만이면 보호자 허락 단계 — 간편 로그인 첫 이용도 동일), 비밀번호 찾기 — 화면과 흐름만, 실제 인증 없음 |
| 먼저 둘러보기 | 회원가입 없이 이용, 기록은 기기(localStorage)에 저장, 로그인하면 이어서 사용 |

기획서 항목별 구현 현황은 [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)에 정리했습니다.

## 학습 장소

| 장소 | 지역 | 안내 인물 | 이야기책 | 얻는 아이템 |
| --- | --- | --- | --- | --- |
| 경복궁 | 서울 | 태조 이성계 | 조선의 궁궐 | 선비의 갓, 관리의 관복 |
| 수원화성 | 수원 | 정조 | 조선의 궁궐 | 정조의 활 |
| 독립기념관 | 천안 | 김구 | 독립운동의 길 | 태극기 |
| 아우내 장터 | 천안 병천 | 유관순 | 독립운동의 길 | 독립선언서 |
| 불국사 | 경주 | 김대성 | 신라 천년의 보물 | 화랑의 검, 화랑 예복 |
| 한산도 (잠김) | 통영 | 이순신 | 임진왜란 이야기 | 장군의 투구, 장군의 갑옷 |
| 훈민정음 반포 (사건) | 어디서나 | 세종 | 세종 시대의 빛 | 학자의 붓 |

## 실행 방법

[Node.js](https://nodejs.org/) 20 이상이 필요합니다.

```bash
npm install      # 처음 한 번만
npm run dev      # 개발 서버 실행 → 터미널에 나오는 주소(http://localhost:5173)를 브라우저로 열기
npm run build    # 배포용 빌드 (타입 검사 포함)
npm run format   # 코드 정렬 (Prettier)
npm run images   # 캐릭터 그림 용량 줄이기 (art/characters → public/images/characters)
```

브라우저 개발자 도구(F12)에서 모바일 화면 모드(Ctrl+Shift+M)로 보면 실제 폰 화면처럼 볼 수 있습니다.

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS v4 · three.js (3D 배경) · Web Speech API (음성) · Web Audio API (배경 음악) · @svg-maps/south-korea (남한 지도) · Vercel Functions + Claude API (AI 퀴즈, 선택)

초기 화면 디자인은 Figma Make로 생성한 뒤 코드 구조를 정리했습니다.

## 폴더 구조

```
src/
├── App.tsx              # 최상위: 화면 전환(로그인/홈/학습/퀴즈) + 진행 상황 연결
├── main.tsx             # React 진입점
├── index.css            # 전체 스타일
├── types.ts             # 공통 타입 정의
├── lib/
│   ├── quizGenerator.ts # AI/자동 퀴즈 생성, 대결 문제
│   ├── speech.ts        # 대사 음성 읽기
│   └── bgm.ts           # 배경 음악
├── three/
│   └── buildScene.ts    # 장소별 3D 장면 만들기
├── hooks/
│   └── useProgress.ts   # 학습 완료·퀴즈 완료·설정을 localStorage에 저장
├── data/                # 목업 데이터 (여기만 고쳐도 내용이 바뀜)
│   ├── places.ts        # 지도 장소 목록
│   ├── contents.ts      # 장소별 학습 글 + 보통 퀴즈
│   ├── quizBank.ts      # 쉬움/어려움 준비 퀴즈
│   ├── facts.ts         # 퀴즈 자동 생성용 사실 묶음
│   ├── figures.ts       # 영상 장면의 역사 인물·대사·목소리·그림 경로
│   ├── badges.ts        # 배지 조건
│   ├── storyBooks.ts    # 이야기책
│   └── avatar.ts        # 아바타 아이템, 대결 친구
├── screens/             # 화면 단위 컴포넌트
│   ├── LoginScreen.tsx
│   ├── OnboardingScreen.tsx  # 아바타 외형·얼굴 등록·학습 단계
│   ├── HomeScreen.tsx   # 하단 탭 + 메뉴 서브 화면 묶음
│   ├── MapScreen.tsx
│   ├── LearnScreen.tsx
│   ├── QuizScreen.tsx
│   ├── QuizHubScreen.tsx
│   ├── StoryBookScreen.tsx
│   ├── AvatarScreen.tsx
│   ├── BattleScreen.tsx # 친구와 대결 (턴제)
│   ├── ProfileScreen.tsx
│   ├── ArchiveScreen.tsx
│   └── SettingsScreen.tsx
└── components/          # 여러 화면에서 쓰는 부품
    ├── CharacterAvatar.tsx # 그림 캐릭터 아바타 (착용 아이템은 배지로 표시)
    ├── Avatar.tsx       # SVG 도형 아바타 (온보딩 미리보기, 그림이 없는 인물 대체용)
    ├── HistoryScene.tsx # 학습 영상 장면 (3D 배경 + 인물 대화 + 음성 + 음악)
    ├── Place3D.tsx      # 장소별 3D 배경 (three.js)
    ├── KoreaMap.tsx, MapMarker.tsx, BottomTabs.tsx, SideMenu.tsx ...
```

## AI 퀴즈 켜기 (선택)

`api/quiz.ts`는 Vercel 서버리스 함수입니다. Vercel에 배포한 뒤 프로젝트 설정 → Environment Variables에 `ANTHROPIC_API_KEY`를 넣으면 AI가 학습 글을 읽고 퀴즈를 만듭니다 (`ANTHROPIC_MODEL`로 모델 변경 가능). 키는 서버에만 있고 브라우저에는 노출되지 않습니다. 키가 없거나 로컬 실행(`npm run dev`)에서는 자동으로 기기 안 생성 퀴즈를 씁니다. API 사용량만큼 비용이 발생합니다.

## 캐릭터 그림 출처

학습 영상 장면의 캐릭터 그림(`public/images/characters/`, 원본은 `art/characters/`)은 팀에서 **Canva AI**로 생성했습니다. 그림이 아직 없는 인물은 코드로 그린 SVG 캐릭터로 보여줍니다.

## 프로토타입 범위

실제 GPS, 로그인 서버, 얼굴 인식, AI 이미지 생성은 연결하지 않고 화면 흐름과 사용 경험을 보여주는 데 집중했습니다.

- 장소 방문 여부는 `data/places.ts`의 `status`로 가정합니다 (`available` = 방문함, `locked` = 미방문).
- 처음 실행하면 시연을 위해 경복궁·수원화성이 학습 완료 상태로 시작합니다. 설정 화면의 '학습 기록 초기화'로 처음 상태로 돌릴 수 있습니다.
- 등록한 얼굴 사진은 서버로 보내지 않고 기기에만 저장합니다.

## 팀

| 이름 | 역할 |
| --- | --- |
| (이름) | 구현 |
| (이름) | |
| (이름) | |
