// 경험치 ↔ 레벨 계산. 모든 화면이 이 함수들만 쓴다 (data/avatar.ts에서 다시 내보냄)

/** 1레벨 → 2레벨에 필요한 경험치 (여기만 고치면 됨) */
export const XP_FIRST_LEVEL = 100

/** 레벨이 오를 때마다 다음 레벨에 필요한 경험치가 늘어나는 양 (여기만 고치면 됨) */
export const XP_LEVEL_STEP = 20

/** level 레벨에서 level+1 레벨이 되기까지 필요한 경험치 (1→2: 100, 2→3: 120, 3→4: 140 ...) */
export function xpNeededAt(level: number) {
  return XP_FIRST_LEVEL + XP_LEVEL_STEP * (Math.max(1, level) - 1)
}

/** level 레벨에 처음 도착하는 데 필요한 누적 경험치 (1레벨은 0) */
export function xpForLevel(level: number) {
  const steps = Math.max(1, Math.floor(level)) - 1
  return steps * XP_FIRST_LEVEL + (XP_LEVEL_STEP * steps * (steps - 1)) / 2
}

/** 경험치로 레벨 계산 */
export function levelFor(xp: number) {
  const safe = Math.max(0, xp)
  let level = 1
  while (safe >= xpForLevel(level + 1)) level += 1
  return level
}

/** 다음 레벨까지 남은 경험치 */
export function xpToNextLevel(xp: number) {
  return xpForLevel(levelFor(xp) + 1) - Math.max(0, xp)
}
