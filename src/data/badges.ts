// 내 정보 > 획득한 배지: 진행 상황으로 자동 획득

export type BadgeStats = {
  footprints: number
  quizzes: number
  /** 학습을 마친 이야기책 챕터 수 */
  chaptersRead: number
  /** 지금 열린 챕터를 모두 읽은 이야기책 수 */
  booksCaughtUp: number
  wins: number
  battles: number
  equippedCount: number
  totalPlaces: number
}

export type Badge = {
  id: string
  /** 이모지. 'footprint'이면 앱의 발자국 아이콘(Icon)으로 그린다 */
  icon: string
  name: string
  how: string
  earned: (s: BadgeStats) => boolean
}

export const badges: Badge[] = [
  {
    id: 'first-step',
    icon: 'footprint',
    name: '첫 발자국',
    how: '역사 장소 1곳 학습하기',
    earned: (s) => s.footprints >= 1,
  },
  {
    id: 'three-steps',
    icon: '🧭',
    name: '세 걸음 탐험가',
    how: '역사 장소 3곳 학습하기',
    earned: (s) => s.footprints >= 3,
  },
  {
    id: 'all-places',
    icon: '🗺️',
    name: '전국 일주',
    how: '방문할 수 있는 모든 장소 학습하기',
    earned: (s) => s.footprints >= s.totalPlaces,
  },
  {
    id: 'quiz-sprout',
    icon: '🌱',
    name: '퀴즈 새싹',
    how: '퀴즈 1개 완료하기',
    earned: (s) => s.quizzes >= 1,
  },
  {
    id: 'quiz-master',
    icon: '🎓',
    name: '퀴즈 박사',
    how: '퀴즈 3개 완료하기',
    earned: (s) => s.quizzes >= 3,
  },
  {
    id: 'bookworm',
    icon: '📖',
    name: '이야기책 완독',
    how: '이야기책 한 권의 열린 이야기 모두 읽기',
    earned: (s) => s.booksCaughtUp >= 1,
  },
  {
    id: 'first-battle',
    icon: '⚔️',
    name: '첫 대결',
    how: '친구와 대결 1번 하기',
    earned: (s) => s.battles >= 1,
  },
  {
    id: 'first-win',
    icon: '🏆',
    name: '첫 승리',
    how: '친구와의 대결에서 이기기',
    earned: (s) => s.wins >= 1,
  },
  {
    id: 'dressed-up',
    icon: '👘',
    name: '멋쟁이 탐험가',
    how: '머리·손·몸에 모두 아이템 착용하기',
    earned: (s) => s.equippedCount >= 3,
  },
]
