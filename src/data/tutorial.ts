import { TOGETHER_MIN_PLACES } from './battle'
import { historyItems } from './avatar'
import type { Spot } from '../components/Spotlight'
import type { Tab } from '../types'

// 처음 시작 체험(튜토리얼): 경복궁 이야기 하나를 직접 해 보며 앱 쓰는 법을 익힌다.
// 말풍선 문구는 모두 이 파일에 모아 둔다. 문구만 고치려면 아래 BEATS의 title·body만 바꾸면 된다.
// 내용(어느 곳을 비추는지, 무엇을 하면 넘어가는지)을 바꿀 때는 docs/TEAM_GUIDE.md의 튜토리얼 항목도 함께 본다.

/**
 * 튜토리얼을 켜는 스위치.
 * 마무리 커밋 전까지는 false로 두고, 주소 끝에 `?tutorial`을 붙여 열 때만 시험해 볼 수 있다.
 */
const TUTORIAL_FINAL = false
export function tutorialEnabled() {
  if (TUTORIAL_FINAL) return true
  try {
    return new URLSearchParams(window.location.search).has('tutorial')
  } catch {
    return false
  }
}

/** 튜토리얼에서 배우는 장소 */
export const TUTORIAL_PLACE = 'gyeongbokgung'

/** 말풍선 문구에 끼워 넣는 지금 상태 */
export type TutorialFacts = {
  /** 학습을 마친 장소 수 */
  learned: number
  /** 모은 아이템 수 / 전체 아이템 수 */
  owned: number
  totalItems: number
}

/** 이 단계가 끝나는 조건 */
export type Advance =
  /** 비춘 곳(selector)을 직접 누르면 */
  | { kind: 'tap'; selector: string }
  /** 화면이 보내는 신호(signal)를 받으면 */
  | { kind: 'signal'; name: string }
  /** 말풍선의 '다음' 버튼을 누르면 (읽기만 하는 단계) */
  | { kind: 'next'; label?: string }

export type Beat = {
  id: string
  /** 이어하기 단위 묶음 (1 지도 · 2 학습 · 3 상상 대화 · 4 퀴즈 · 5 아이템 · 6 아바타 · 7 마무리) */
  group: 1 | 2 | 3 | 4 | 5 | 6 | 7
  /** 홈 화면일 때 보여줄 탭 */
  tab?: Tab
  /** 밝게 비출 곳 (여기만 누를 수 있다) */
  spots: Spot[]
  /** 비춘 곳 말고 눌러도 되는 곳 */
  allow?: string
  /** 화면 안으로 자동 스크롤하지 않기 (낱말 뜻 풍선처럼 스크롤하면 닫히는 곳) */
  noScroll?: boolean
  /**
   * 말풍선 자리. 기본은 비춘 곳 옆.
   * top: 화면 위쪽 / compact: 비춘 곳이 화면 거의 전체일 때 맨 위에 작은 띠로
   */
  bubble?: 'top' | 'compact'
  /** 글에 \n이 있으면 줄이 바뀐다 */
  title: string
  body: string | ((facts: TutorialFacts) => string)
  advance: Advance
}

export const BEATS: Beat[] = [
  // ---------- 1. 지도 ----------
  {
    id: 'arrive',
    group: 1,
    tab: 'map',
    spots: [{ selector: `.map-marker[data-place="${TUTORIAL_PLACE}"]` }],
    title: '경복궁에 도착했어요!',
    body: '경복궁의 이야기가 열렸어요.\n지도에서 경복궁 표시를 눌러 볼까요?',
    advance: { kind: 'tap', selector: `.map-marker[data-place="${TUTORIAL_PLACE}"]` },
  },
  {
    id: 'open-card',
    group: 1,
    tab: 'map',
    spots: [{ selector: '.place-card' }],
    title: '이야기를 열어 볼까요?',
    body: '카드를 누르면 경복궁 이야기가 시작돼요.',
    advance: { kind: 'tap', selector: '.place-card' },
  },
  // ---------- 2. 학습 ----------
  {
    id: 'word',
    group: 2,
    spots: [{ selector: '.learn-article .gloss' }],
    title: '쉬운 글로 읽어요',
    body: '‘쉬움’ 단계의 글이에요. 천천히 읽어 보세요.\n점선 밑줄이 있는 낱말을 누르면 뜻이 나와요. 하나 눌러 볼까요?',
    advance: { kind: 'tap', selector: '.learn-article .gloss' },
  },
  {
    id: 'word-meaning',
    group: 2,
    spots: [{ selector: '.learn-article .gloss' }],
    noScroll: true,
    bubble: 'top',
    title: '낱말 뜻이 나왔어요',
    body: '어려운 낱말은 이렇게 쉽게 풀어 줘요.\n이제 경복궁을 세운 분을 만나 볼까요?',
    advance: { kind: 'next', label: '다음' },
  },
  // ---------- 3. 상상 대화 ----------
  {
    id: 'scene',
    group: 3,
    spots: [{ selector: '.history-scene' }],
    title: '태조 이성계와 대화해요',
    body: '‘만나기’를 누르고, 화면을 눌러 대화를 끝까지 넘겨 보세요.',
    advance: { kind: 'signal', name: 'scene-end' },
  },
  // ---------- 4. 퀴즈 ----------
  {
    id: 'to-quiz',
    group: 4,
    spots: [{ selector: '.learn-actions .action-button.primary' }],
    title: '퀴즈로 확인해요',
    body: '배운 내용을 퀴즈로 풀어 봐요.\n‘퀴즈 풀어보기’를 눌러 주세요.',
    advance: { kind: 'tap', selector: '.learn-actions .action-button.primary' },
  },
  {
    id: 'quiz',
    group: 4,
    bubble: 'compact',
    spots: [{ selector: '.quiz-body, .quiz-action', all: true }],
    title: '퀴즈 2문제',
    body: '답을 골라 보세요. 틀려도 괜찮아요!\n다 풀면 결과가 나와요.',
    advance: { kind: 'signal', name: 'quiz-finished' },
  },
  {
    id: 'quiz-result',
    group: 4,
    spots: [{ selector: '.result-screen .action-button.primary' }],
    title: '퀴즈를 마쳤어요',
    body: '버튼을 누르면 경복궁 학습이 내 기록에 남아요.',
    advance: { kind: 'tap', selector: '.result-screen .action-button.primary' },
  },
  // ---------- 5. 아이템 ----------
  {
    id: 'wear',
    group: 5,
    spots: [{ selector: '.reward-modal .complete-actions .action-button.primary' }],
    title: '역사 아이템을 얻었어요!',
    body: '장소를 배우면 그곳의 아이템을 얻어요.\n‘바로 입어보기’를 눌러 내 캐릭터에게 입혀 봐요. 카드가 여러 장이면 모두 입어 보세요.',
    advance: { kind: 'signal', name: 'item-worn' },
  },
  // ---------- 6. 아바타 ----------
  {
    id: 'avatar-wear',
    group: 6,
    tab: 'avatar',
    spots: [{ selector: '.avatar-stage' }],
    title: '입은 모습이에요!',
    body: '아이템을 입으면 캐릭터가 바뀌고 전투력도 올라요.',
    advance: { kind: 'next', label: '다음' },
  },
  {
    id: 'dex',
    group: 6,
    bubble: 'compact',
    tab: 'avatar',
    spots: [{ selector: '.inventory-heading, .item-category-tabs, .history-item-grid', all: true }],
    title: '역사 아이템 도감',
    body: (facts) =>
      `지금까지 모은 아이템은 ${facts.totalItems}개 중 ${facts.owned}개예요.\n아직 못 얻은 아이템은 검은 실루엣으로 보여요. 장소를 더 배우면 하나씩 채워져요!`,
    advance: { kind: 'next', label: '다음' },
  },
  // ---------- 7. 마무리 ----------
  {
    id: 'map-legend',
    group: 7,
    bubble: 'compact',
    tab: 'map',
    spots: [{ selector: '.map-marker', all: true }],
    title: '장소 표시를 읽어 봐요',
    body: '회색 자물쇠는 아직 안 가 본 곳, 초록은 이야기가 열린 곳, 발자국은 학습을 마친 곳이에요.\n방금 경복궁에도 발자국이 남았어요!',
    advance: { kind: 'next', label: '다음' },
  },
  {
    id: 'book',
    group: 7,
    tab: 'book',
    spots: [{ selector: '.bookshelf' }],
    title: '이야기책',
    body: '배운 이야기는 주제별 책으로 모여요. 언제든 다시 읽을 수 있어요.',
    advance: { kind: 'next', label: '다음' },
  },
  {
    id: 'together',
    group: 7,
    tab: 'avatar',
    spots: [{ selector: '.together' }],
    title: '함께하기와 랭킹',
    body: (facts) =>
      `장소 ${TOGETHER_MIN_PLACES}곳을 학습하면 친구와 함께하는 보스전과 대결이 열려요. 지금은 ${Math.min(facts.learned, TOGETHER_MIN_PLACES)}곳이에요.\n대결에서는 친구들과 순위(랭킹)도 겨뤄요.`,
    advance: { kind: 'next', label: '시작하기' },
  },
]

/** 튜토리얼에서 얻는 아이템 */
export const tutorialItems = historyItems.filter((item) => item.placeId === TUTORIAL_PLACE)

/**
 * 앱을 닫았다 다시 열었을 때 이어갈 단계의 위치.
 * 학습·상상 대화·퀴즈(2~4)는 도중 상태가 저장되지 않으므로 처음(1)부터. 이미 경복궁 기록이 있으면 건너뛴다.
 */
export function startBeatIndex(step: number, learned: boolean, worn: boolean) {
  let group = step
  if (group <= 4 && learned) group = worn ? 6 : 5
  else if (group === 5 && worn) group = 6
  const index = BEATS.findIndex((beat) => beat.group === group)
  return index < 0 ? 0 : index
}
