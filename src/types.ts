// 앱 전체에서 쓰는 타입 정의

export type Screen = 'login' | 'signup' | 'reset' | 'challenge' | 'onboarding' | 'home' | 'learn' | 'quiz'
/** 간편 로그인 회사 */
export type SocialProvider = 'kakao' | 'naver' | 'google'
export type Tab = 'map' | 'book' | 'avatar' | 'profile'
export type SubPage = 'main' | 'archive' | 'settings' | 'help' | 'quiz-new' | 'quiz-review'
export type Difficulty = '쉬움' | '보통' | '어려움'

export type IconName =
  | 'menu'
  | 'layers'
  | 'plus'
  | 'minus'
  | 'locate'
  | 'map'
  | 'book'
  | 'user'
  | 'profile'
  | 'arrow'
  | 'footprint'
  | 'lock'
  | 'check'
  | 'close'
  | 'archive'
  | 'quiz'
  | 'refresh'
  | 'settings'
  | 'sparkle'
  | 'play'
  | 'chevron'
  | 'search'
  | 'bell'
  | 'camera'
  | 'heart'
  | 'edit'
  | 'image'
  | 'help'

/**
 * 지도에 표시되는 역사 장소
 * - available: 방문해서 학습이 해금된 장소 (프로토타입에서는 "방문했다"고 가정)
 * - locked: 아직 방문하지 않아 잠긴 장소
 * 학습 완료(발자국) 여부는 장소 데이터가 아니라 사용자 진행 상황(useProgress)에서 관리한다.
 */
export type Place = {
  id: string
  name: string
  region: string
  status: 'available' | 'locked'
  /**
   * site: 위치가 정해진 유적지
   * event: 위치가 분명하지 않은 역사적 사건 → 학습한 순간 사용자의 위치에 발자국이 찍힌다
   */
  kind: 'site' | 'event'
  /** 지도 위 마커 위치 (지도 영역 기준 %). event는 학습 기록의 위치를 쓴다 */
  top: string
  left: string
  /** 지도에서 발자국을 눌렀을 때 보이는 두 줄 요약 */
  summary: string
}

export type QuizItem = {
  question: string
  options: string[]
  /** 정답 보기의 인덱스 (0부터 시작) */
  answer: number
  note: string
}

/** 장소별 학습 콘텐츠 */
export type PlaceContent = {
  placeId: string
  heroImage: string
  heroAlt: string
  tagline: string
  readMinutes: number
  headline: string
  sectionTitle: string
  body: Record<Difficulty, { intro: string; detail: string }>
  didYouKnow: string
  detailImage: string
  detailCaption: string
  remember: string
  /** 퀴즈 난이도는 학습 글 난이도와 같다 */
  quiz: Record<Difficulty, QuizItem[]>
}

/** 학습 기록 한 건 (학습 아카이브에 표시) */
export type LearningRecord = {
  placeId: string
  learnedAt: string
  quizAt?: string
  /** event 장소의 발자국 위치 (학습한 순간의 사용자 위치) */
  top?: string
  left?: string
}

/** 그림 캐릭터의 머리 모양 (성별마다 고를 수 있는 것이 다르다. data/avatar.ts의 characterStyles) */
export type CharacterStyleId = 'boy-short' | 'boy-sangtu' | 'girl-braid' | 'girl-bob' | 'girl-long'

export type AvatarLook = {
  gender: '남' | '여'
  /** 그림 캐릭터 머리 모양. 없거나 성별과 맞지 않으면 성별 기본 머리 모양을 쓴다 */
  style?: CharacterStyleId
  // 아래 셋은 SVG 캐릭터(Avatar.tsx)용
  body: '마름' | '보통' | '튼튼'
  hair: '짧은 머리' | '긴 머리' | '상투·쪽머리'
  skin: string
}

export type Equipped = Partial<Record<ItemCategory, string>>

export type StoryChapter = {
  title: string
  location: string
  /** 장소와 연결된 챕터면 placeId를 넣는다. 장소가 해금되면 챕터도 해금된다. */
  placeId?: string
  /** placeId가 없는 챕터(아직 콘텐츠 없음)의 해금 여부 */
  unlocked?: boolean
}

export type StoryBookData = {
  id: string
  title: string
  subtitle: string
  /** 표지 색 */
  cover: string
  /** 표지 가운데 한자 한 글자 */
  emblem: string
  tags: string[]
  chapters: StoryChapter[]
}

export type ItemCategory = '장비' | '무기' | '의복'

export type HistoryItem = {
  id: string
  name: string
  shortName: string
  /** 장비 = 머리, 무기 = 손, 의복 = 몸 */
  category: ItemCategory
  symbol: string
  /** 이 장소의 학습을 완료하면 아이템을 얻는다 */
  placeId: string
  rarity: string
  description: string
  stats: { 공격: number; 방어: number; 지혜: number }
  /**
   * 그림 캐릭터 위에 겹쳐 그릴 옷·장비 그림 (투명 PNG, 내 캐릭터 그림과 같은 크기·위치로 그린 것).
   * 비어 있으면 캐릭터 주변에 작은 원형 배지로 보여준다.
   */
  art?: string
}
