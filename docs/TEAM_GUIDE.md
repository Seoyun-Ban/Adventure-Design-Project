# 개발 가이드

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

내 캐릭터 그림을 바꾸거나 머리 모양을 추가하면 `src/data/avatar.ts`의 `characterStyles`에서 그림 경로, 얼굴 사진 위치(`face`), 아이템 배지 자리(`slots`), 머리·손 아이템 자리(`mounts`)를 그림에 맞게 고쳐야 합니다. 머리 모양을 추가할 때는 `src/types.ts`의 `CharacterStyleId`에도 이름을 더합니다. 성별마다 맨 앞에 적은 머리 모양이 기본값이에요. 얼굴 사진은 윤곽대로 잘라 붙이므로 `face` 값을 같이 쓰고, 어색하면 같은 파일의 `CUTOUT_FIT`(공통)이나 그림별 `cutout`(옮김·배율)을 조정하세요. 얼굴은 기본이 사진 그대로이며 색감 보정 강도는 `src/lib/faceCrop.ts`의 `PHOTO_TONE`, 만화풍(설정에서 선택) 강도는 `CARTOON_STYLE`에서 바꿉니다.

### 아이템 그림 넣기

머리·손 아이템은 캐릭터에 직접 입혀집니다. 옷은 **옷을 입은 캐릭터 그림**으로 통째로 바뀌고, 그 머리 모양의 옷 그림이 아직 없으면 캐릭터 옆에 원형 배지로 보입니다.

| 아이템 | 파일 | 상태 |
| --- | --- | --- |
| 선비 갓, 장군 투구 (머리) | `item-gat.png`, `item-helmet.png` | ✅ |
| 정조 활, 화랑 검, 독립선언서 (손) | `item-bow.png`, `item-sword.png`, `item-declaration.png` | ✅ |
| 태극기 (손) | 코드로 그림 (`components/ItemArtView.tsx`, 국기 규격대로 `Taegukgi.tsx`) | ✅ |
| 관복, 화랑 예복, 갑옷 (몸) | 옷을 입은 캐릭터 그림 `me-{머리모양}-{옷}.png` (옷: robe·hwarang·armor) | 머리 모양 5종 모두 ✅ (15장) |

옷 그림 넣는 법: 기본 캐릭터와 **같은 자세·같은 크기**로 옷만 바꾼 투명 PNG를 `art/characters/me-{머리모양}-{옷}.png`로 넣고 `npm run images`만 실행하면 앱이 자동으로 그 그림을 써요 (모자·손 위치가 어긋나면 `src/data/avatar.ts`의 `OUTFIT_FIT`에서 맞춰요).

새 아이템 그림 넣는 법:
1. 아이템만 그린 투명 PNG를 `art/characters/item-이름.png`로 넣고 `npm run images`
2. `src/data/avatar.ts`의 그 아이템에 `art`를 적는다
   - `anchor`: 아이템 그림에서 캐릭터에 맞출 점 (모자: 이마에 닿는 아래 테두리, 손 아이템: 쥐는 부분)
   - 모자는 `width`(머리 너비의 몇 배), 손 아이템은 `height`(캐릭터 키의 몇 %)
   - 모자 아래쪽(끈·목가리개)이 얼굴을 가리면 `split`(나눌 높이 %)과 `below`('behind' 뒤에 그리기 / 'hide' 빼기)
   - 그림 옆에 세로 이름표를 붙이려면 `tag` (예: 독립선언서). 아이템 목록·상세 창·획득 카드에서만 보이고 손에 들 때는 작아서 빠져요
3. 캐릭터 그림마다 머리·손 자리는 `characterStyles`의 `mounts`에 있다 (그림을 바꾸면 이 값도 다시 맞춘다)

⚠️ 태극기가 들어간 그림은 꼭 크게 확대해서 확인하세요. AI 그림은 괘 배치나 태극 소용돌이 방향이 틀리는 경우가 많습니다. (`item-flag.png`는 태극 방향이 뒤집혀 있어서 쓰지 않고 코드로 그렸습니다. 원본은 `art/unused/`에 보관 — 이 폴더는 `npm run images`가 처리하지 않아요.)

### 영상 장면 목소리 (현재 꺼 둠)

녹음 파일을 넣으면 재생할 수 있는 구조를 갖춰 두었고, 현재는 꺼 둔 상태입니다. 대사는 말풍선 글자가 한 글자씩 나타나는 효과로만 보여주고, 소리 버튼도 숨겨져 있어요.

- 켜고 끄는 값: `src/lib/speech.ts` 위쪽의 `SCENE_VOICE_ENABLED` (지금은 `false`)
- 녹음 파일 위치: `public/audio/장소id/줄번호.mp3` (줄번호는 1부터, `src/data/figures.ts`의 대사 순서). 내 캐릭터 대사는 `줄번호-boy.mp3`, `줄번호-girl.mp3`
- 파일 목록(`src/data/generated/audioFiles.ts`)은 `npm run dev`나 `npm run build`를 할 때 자동으로 만들어집니다. 앱은 이 목록에 있는 파일만 재생해요.
- 녹음 파일이 없는 줄은 기기의 한국어 목소리로 읽습니다.

### 사진 (학습 글 중간 사진)

학습 글 문단 사이에 사진이 **자동으로 고르게** 들어갑니다 (사람이 위치를 고르지 않음). 사진이 없는 장소는 글만 나옵니다.

**사진 규칙 (꼭 지키기)**
- **공공누리 제1유형·제2유형 사진만** 쓴다. (제3·4유형 = 변경 금지는 사진을 자르거나 줄이므로 쓰지 않는다)
- **이용 조건을 확인할 수 없는 사진은 넣지 않는다.**
- **출처를 꼭 표시한다.** 앱에서는 사진 아래 작은 글씨로 나오고, 출처 칸이 비어 있으면 사진이 앱에 들어가지 않는다.

**사진 넣는 법**
1. 원본을 `art/photos/장소id/`에 넣는다. 장소 id: gyeongbokgung(경복궁), suwon(수원화성), independence(독립기념관), aunae(아우내 장터), bulguksa(불국사), hansando(한산도). 원본은 용량이 커서 내 컴퓨터에만 두고 저장소에는 올라가지 않는다.
2. `art/photos/sources.csv`에 한 줄을 적는다: `장소,파일 이름,사진 설명,출처,페이지 주소,자르기` (엑셀로 열어도 된다). 자르기는 비워 두거나 위·가운데·아래·왼쪽·오른쪽 (목록에서 4:3으로 잘릴 때 어디를 보여줄지, 크게 보기에서는 전체가 나온다).
3. `npm run images`를 실행하면 휴대폰에 맞게 줄여 `public/images/photos/장소id/`에 저장하고 목록(`src/data/generated/photos.ts`)이 갱신된다. 줄인 사진·sources.csv·photos.ts를 커밋한다.
4. README '사진 출처'는 이 sources.csv와 같게 유지한다.

**npm run photos (자동 수집 도구)**: 국가유산청 공개 API(키 불필요)로 후보를 받는 도구를 검토했지만, 사진별 이용 조건 코드(`imageNuri`)의 뜻과 촬영 연도를 공식 자료로 확인하지 못해 **아직 만들지 않았다.** 확인되기 전까지는 위 방법으로 직접 넣는다.


