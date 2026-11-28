import type { Difficulty } from '../types'

// 친구와 대결: 난이도별 공격·방어 수치를 한 곳에 모았다 (여기만 고치면 화면 숫자도 같이 바뀐다)
// - attack: 공격 피해에 곱하는 값 (보통 1.0이 예전 대결과 같다)
// - heal: 방어를 고르면 회복하는 체력
// - block: 방어한 다음 상대 공격을 막는 비율 (0.9 = 90%)
export const BATTLE_LEVELS: Record<Difficulty, { attack: number; heal: number; block: number }> = {
  쉬움: { attack: 0.8, heal: 4, block: 0.5 },
  보통: { attack: 1, heal: 8, block: 0.7 },
  어려움: { attack: 1.4, heal: 12, block: 0.9 },
}

// ---------- 가상 친구와의 대결 밸런스 (여기 숫자만 고치면 대결·랭킹·안내가 모두 따라 바뀐다) ----------
// 진짜 친구의 도전장 대결은 이 규칙을 쓰지 않고 예전 규칙(체력 100·고정 피해) 그대로다.
// 계산은 lib/battleBalance.ts, 승률은 scripts/battle.test.mjs가 같은 숫자로 검사한다.

/** 내 대결 규칙 */
export const BATTLE_RULES = {
  /** 내 체력 (레벨이 올라도 늘지 않는다) */
  hp: 100,
  /** 기본 피해 = 이 값 + 전투력÷45. 난이도별 피해는 이 기본 피해에 BATTLE_RANGES의 attack 배수를 곱한 값 */
  attackBase: 15,
}

/**
 * 난이도별 무작위 범위 (가상 친구와의 대결). 난이도끼리 범위가 겹치지 않아서
 * 어려움은 항상 보통보다, 보통은 항상 쉬움보다 세게 들어간다 (scripts/battle.test.mjs가 검사한다).
 * - attack: 기본 피해에 곱하는 배수 [최소, 최대] (공격은 내 것·가상 친구 것 모두 이 범위)
 * - heal: 방어로 회복하는 체력 [최소, 최대] (가상 친구는 체력에 비례해 늘린다)
 * - block: 방어한 다음 상대 공격을 막는 비율 [최소, 최대]
 */
export const BATTLE_RANGES: Record<
  Difficulty,
  { attack: readonly [number, number]; heal: readonly [number, number]; block: readonly [number, number] }
> = {
  쉬움: { attack: [0.6, 0.86], heal: [2, 5], block: [0.35, 0.58] },
  보통: { attack: [0.94, 1.18], heal: [6, 10], block: [0.62, 0.8] },
  어려움: { attack: [1.26, 1.6], heal: [11, 14], block: [0.84, 0.95] },
}

export type FriendBalance = {
  /** 내 레벨에 더하는 값 (친구 레벨 = 내 레벨 + 이 값, 최소 1) */
  levelOffset: number
  /** 친구 전투력 = 내 전투력 × 이 값 */
  powerRatio: number
  /** 친구 체력 = 내 평균 공격 1번 × 이 값 (클수록 오래 버틴다) */
  hitsToKill: number
  /** 친구가 고르는 문제 난이도의 비중 (합 1) */
  difficulty: Record<Difficulty, number>
  /** 정답을 맞혔을 때 평소 방어를 고를 확률 */
  defendChance: number
}

export const FRIEND_BALANCE = {
  /** 친구 체력의 아래·위 한계 */
  hpMin: 70,
  hpMax: 260,
  /** 내 레벨이 5보다 1 높을 때마다 친구 체력에 곱하는 값이 이만큼 줄어든다 (낮은 레벨은 조금 어렵게, 높은 레벨은 조금 쉽게 해서 승률을 고르게 맞춘다) */
  hpLevelAdjust: 0.018,
  /** 친구 공격 피해 = (이 값 + 전투력÷45 × attackPowerWeight) × 난이도별 배수 범위(BATTLE_RANGES) 안의 무작위. 내 체력이 100으로 고정이라 전투력 영향은 작게 둔다 */
  attackBase: 24,
  attackPowerWeight: 0.1,
  /** 친구 정답률 = 기본 + 레벨 × 레벨당, 최대 accuracyMax. 난이도별 보정을 곱한다 */
  accuracyBase: 0.58,
  accuracyPerLevel: 0.005,
  accuracyMax: 0.8,
  accuracyByDifficulty: { 쉬움: 1.1, 보통: 1, 어려움: 0.8 } as Record<Difficulty, number>,
  /** 친구 체력이 이 비율보다 낮으면 방어를 고를 확률이 lowHpDefendChance로 올라간다 */
  lowHpRatio: 0.47,
  lowHpDefendChance: 0.36,
  /** 친구별 성격 (키는 data/avatar.ts battleFriends의 id) */
  friends: {
    seoyeon: {
      levelOffset: 1,
      powerRatio: 1,
      hitsToKill: 5.2,
      difficulty: { 쉬움: 0.2, 보통: 0.6, 어려움: 0.2 },
      defendChance: 0.23,
    },
    minjun: {
      levelOffset: 0,
      powerRatio: 1.05,
      hitsToKill: 4.9,
      difficulty: { 쉬움: 0.1, 보통: 0.4, 어려움: 0.5 },
      defendChance: 0.25,
    },
    jiho: {
      levelOffset: -1,
      powerRatio: 0.95,
      hitsToKill: 6.1,
      difficulty: { 쉬움: 0.5, 보통: 0.4, 어려움: 0.1 },
      defendChance: 0.16,
    },
  } as Record<string, FriendBalance>,
}

// 함께하기(대결·보스전)가 열리는 조건: 학습을 마친 장소가 이 수 이상이어야 한다 (여기만 고치면 안내 글도 같이 바뀐다)
export const TOGETHER_MIN_PLACES = 3

// 대결 랭킹(리그): 서버가 없어서 나와 가상 친구들끼리의 순위표다.
// 가상 친구들이 처음 갖고 있는 승패 기록 (키는 data/avatar.ts battleFriends의 id). 내가 대결하면 그 친구의 기록도 함께 바뀐다.
export const LEAGUE_START: Record<string, { wins: number; losses: number }> = {
  seoyeon: { wins: 5, losses: 2 },
  minjun: { wins: 4, losses: 3 },
  jiho: { wins: 2, losses: 4 },
}
