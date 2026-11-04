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

// 함께하기(대결·보스전)가 열리는 조건: 학습을 마친 장소가 이 수 이상이어야 한다 (여기만 고치면 안내 글도 같이 바뀐다)
export const TOGETHER_MIN_PLACES = 3
