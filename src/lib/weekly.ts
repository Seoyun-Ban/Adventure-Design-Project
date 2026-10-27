import type { LearningRecord } from '../types'

// 이번 주 탐험: 최근 7일 동안 학습한 장소 수와 목표
// 내 정보 탭과 사이드 메뉴가 같은 계산·같은 목표를 쓴다.

/** 일주일 목표 (장소 수) */
export const WEEKLY_GOAL = 3

/** 최근 7일 동안 학습한 장소 수 */
export function weeklyCount(records: LearningRecord[]) {
  return records.filter((record) => Date.now() - new Date(record.learnedAt).getTime() < 7 * 86400000).length
}
