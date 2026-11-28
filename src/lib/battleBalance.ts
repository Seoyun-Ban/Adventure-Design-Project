// 가상 친구와의 대결 계산 (순수 함수). 숫자는 data/battle.ts에만 있고, 화면(BattleScreen)과
// 승률 테스트(scripts/battle.test.mjs)가 같은 함수를 쓴다. random은 테스트에서 시드 난수로 바꿔 끼운다.
// node 테스트가 읽을 수 있게 data 가져오기에 .ts를 붙였다.
import { BATTLE_RANGES, BATTLE_RULES, FRIEND_BALANCE } from '../data/battle.ts'
import type { Difficulty } from '../types'

export type Random = () => number

const between = (range: readonly [number, number], random: Random) => range[0] + random() * (range[1] - range[0])

/** 시드를 주면 매번 같은 순서로 숫자를 내는 난수 (테스트용) */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 내 기본 피해 (난이도 배수를 곱하기 전) */
export const baseAttack = (power: number) => BATTLE_RULES.attackBase + power / 45

/** 내 공격 한 번의 피해 (난이도별 범위 안에서 무작위) */
export function rollMyAttack(power: number, level: Difficulty, random: Random = Math.random) {
  return Math.max(1, Math.round(baseAttack(power) * between(BATTLE_RANGES[level].attack, random)))
}

/** 화면에 보여줄 내 공격 피해의 최소·최대 */
export const attackRange = (power: number, level: Difficulty): [number, number] => {
  const [low, high] = BATTLE_RANGES[level].attack
  return [Math.round(baseAttack(power) * low), Math.round(baseAttack(power) * high)]
}

/** 방어 한 번의 회복량과 막기 비율 (난이도별 범위 안에서 무작위). healScale은 가상 친구의 체력 비례용 */
export function rollDefend(level: Difficulty, random: Random = Math.random, healScale = 1) {
  const { heal, block } = BATTLE_RANGES[level]
  return {
    heal: Math.max(1, Math.round(between(heal, random) * healScale)),
    block: between(block, random),
  }
}

export type ScaledFriend = {
  id: string
  level: number
  power: number
  maxHp: number
}

/** 내 레벨·전투력에 맞춘 가상 친구의 레벨·전투력·체력 */
export function scaleFriend(friendId: string, myLevel: number, myPower: number): ScaledFriend {
  const balance = FRIEND_BALANCE.friends[friendId]
  const myHit = baseAttack(myPower)
  const levelFactor = 1 - FRIEND_BALANCE.hpLevelAdjust * (myLevel - 5)
  const raw = myHit * balance.hitsToKill * levelFactor
  const maxHp = Math.round(Math.min(FRIEND_BALANCE.hpMax, Math.max(FRIEND_BALANCE.hpMin, raw)))
  return {
    id: friendId,
    level: Math.max(1, myLevel + balance.levelOffset),
    power: Math.round(myPower * balance.powerRatio),
    maxHp,
  }
}

/** 랭킹·목록에서 쓸 가상 친구 레벨 (전투력은 필요 없다) */
export const friendLevel = (friendId: string, myLevel: number) =>
  Math.max(1, myLevel + FRIEND_BALANCE.friends[friendId].levelOffset)

export type FriendAction =
  | { kind: 'miss'; difficulty: Difficulty }
  | { kind: 'attack'; difficulty: Difficulty; damage: number }
  | { kind: 'defend'; difficulty: Difficulty; heal: number; block: number }

/** 가상 친구 한 차례: 문제를 풀고(맞히면) 공격이나 방어를 고른다. 막기 비율(myBlock)은 내 방어가 있을 때만 0보다 크다 */
export function friendTurn(
  friend: ScaledFriend,
  friendHp: number,
  myBlock: number,
  random: Random = Math.random,
): FriendAction {
  const balance = FRIEND_BALANCE.friends[friend.id]
  // 문제 난이도 고르기
  let pick = random()
  let difficulty: Difficulty = '보통'
  for (const level of ['쉬움', '보통', '어려움'] as Difficulty[]) {
    pick -= balance.difficulty[level]
    if (pick <= 0) {
      difficulty = level
      break
    }
  }
  const accuracy = Math.min(
    FRIEND_BALANCE.accuracyMax,
    (FRIEND_BALANCE.accuracyBase + friend.level * FRIEND_BALANCE.accuracyPerLevel) *
      FRIEND_BALANCE.accuracyByDifficulty[difficulty],
  )
  if (random() >= accuracy) return { kind: 'miss', difficulty }
  const low = friendHp < friend.maxHp * FRIEND_BALANCE.lowHpRatio
  if (random() < (low ? FRIEND_BALANCE.lowHpDefendChance : balance.defendChance)) {
    return { kind: 'defend', difficulty, ...rollDefend(difficulty, random, friend.maxHp / BATTLE_RULES.hp) }
  }
  const base = FRIEND_BALANCE.attackBase + (friend.power / 45) * FRIEND_BALANCE.attackPowerWeight
  const raw = base * between(BATTLE_RANGES[difficulty].attack, random)
  return { kind: 'attack', difficulty, damage: Math.max(1, Math.round(raw * (1 - myBlock))) }
}

/** 가상 친구 목록의 레벨을 내 레벨에 맞춘 것으로 바꾼다 (랭킹·순위 계산용) */
export const withFriendLevels = <T extends { id: string; level: number }>(friends: T[], myLevel: number): T[] =>
  friends.map((friend) => ({ ...friend, level: friendLevel(friend.id, myLevel) }))
