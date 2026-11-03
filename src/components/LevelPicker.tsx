import type { Difficulty } from '../types'

export type LevelPickerItem = {
  level: Difficulty
  /** 난이도 이름 옆의 설명 */
  hint: string
  /** 오른쪽 끝에 보여줄 수치 (예: 피해 12) */
  tag: string
}

// 차례마다 난이도(쉬움/보통/어려움)를 고르는 목록. 보스전과 친구와 대결이 함께 쓴다.
export function LevelPicker({
  items,
  onPick,
}: {
  items: LevelPickerItem[]
  onPick: (level: Difficulty) => void
}) {
  return (
    <div className="level-picker">
      {items.map(({ level, hint, tag }) => (
        <button type="button" key={level} onClick={() => onPick(level)}>
          <strong>{level}</strong>
          <span>{hint}</span>
          <em>{tag}</em>
        </button>
      ))}
    </div>
  )
}
