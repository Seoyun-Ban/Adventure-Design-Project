import type { Difficulty } from '../types'

// 함께하기 > 보스전(협동): 보스의 이름·모습·말과 게임 규칙 숫자를 한 곳에 모았다.
// 보스를 바꾸려면 BOSS만 고치면 된다.

export const BOSS = {
  name: '까먹기 괴물',
  /** 보스 모습 (이모지. 그림을 쓰려면 BossScreen의 .boss-face 안을 <img>로 바꾼다) */
  face: '👾',
  /** 보스 몸 색 (CSS 색) */
  color: '#8a6bb8',
  intro: '우리가 배운 역사를 모두 잊게 만들려고 해요!',
  hitLine: '으아악! 기억이 떠올랐어!',
  /** 틀리거나 시간이 다 됐을 때 괴물의 반격 */
  counterLine: '까먹기 공격! 기억이 흐려졌어요',
  timeoutLine: '시간이 다 됐어요!',
  winTitle: '까먹기 괴물을 물리쳤어요!',
  winText: '함께 역사를 기억해 낸 덕분이에요.',
  fledTitle: '까먹기 괴물이 도망갔어요!',
  fledText: '다시 도전해요',
  loseTitle: '까먹기 괴물에게 졌어요!',
  loseText: '다시 도전해요',
} as const

/** 함께할 사람 수 */
export const BOSS_MIN_PLAYERS = 2
export const BOSS_MAX_PLAYERS = 4
/** 이름 최대 글자 수 */
export const BOSS_NAME_MAX = 6

/** 팀 하트 수: 틀리거나 시간이 다 되면 하나씩 줄고, 0이 되면 진다 */
export const BOSS_HEARTS = 3
/** 문제마다 제한 시간 (초) */
export const BOSS_TIME_LIMIT = 15

/** 한 사람당 보스 체력. 사람이 늘면 체력도 늘어난다 */
export const BOSS_HP_PER_PLAYER = 80
/** 모두가 한 번씩 푸는 것을 1라운드로 센다. 이 안에 쓰러뜨려야 한다 */
export const BOSS_ROUNDS = 10

/** 난이도별 기본 피해 (어려울수록 크게) */
export const BOSS_DAMAGE: Record<Difficulty, number> = { 쉬움: 8, 보통: 12, 어려움: 18 }
/** 연속으로 맞힐 때 한 번 더 이어질 때마다 더해지는 피해와 그 최대 횟수 */
export const BOSS_COMBO_BONUS = 3
export const BOSS_COMBO_MAX = 4

/** 보스를 물리치면 받는 경험치 */
export const BOSS_WIN_XP = 50

export const bossMaxHp = (players: number) => BOSS_HP_PER_PLAYER * players

/** 콤보(연속 정답 수)에 따른 보너스 피해. 첫 정답은 0, 두 번째부터 늘어난다 */
export const comboBonus = (streak: number) =>
  Math.min(Math.max(streak - 1, 0), BOSS_COMBO_MAX) * BOSS_COMBO_BONUS
