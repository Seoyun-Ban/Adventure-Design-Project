import { useState, type FormEvent } from 'react'
import { ActionButton } from './ActionButton'
import { FieldHint } from './AuthHeader'
import { BottomSheet } from './BottomSheet'

/** 닉네임 최대 글자 수 (앞뒤 공백을 지운 뒤 센다) */
export const NICKNAME_MAX = 10

// 닉네임 바꾸기 창 (내 정보 탭, 설정 화면에서 함께 쓴다)
export function NicknameSheet({
  current,
  onSave,
  onClose,
}: {
  current: string
  onSave: (nickname: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(current)
  const trimmed = value.trim()
  // 한글·이모지도 한 글자로 세도록 문자 단위로 센다
  const length = [...trimmed].length
  const tooLong = length > NICKNAME_MAX
  const canSave = length > 0 && !tooLong && trimmed !== current

  function submit(event: FormEvent) {
    event.preventDefault()
    if (canSave) onSave(trimmed)
  }

  return (
    <BottomSheet title="닉네임 바꾸기" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span className="field-label-row">
            새 닉네임
            <em className={tooLong ? 'over' : ''} aria-live="polite">
              {length}/{NICKNAME_MAX}
            </em>
          </span>
          <input
            autoFocus
            maxLength={NICKNAME_MAX * 2}
            placeholder="작은 탐험가"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {tooLong && <FieldHint ok={false}>{`닉네임은 ${NICKNAME_MAX}글자까지 쓸 수 있어요.`}</FieldHint>}
          {length === 0 && <FieldHint ok={false}>닉네임을 적어 주세요.</FieldHint>}
          {length > 0 && !tooLong && trimmed === current && (
            <FieldHint ok>지금 쓰고 있는 닉네임이에요.</FieldHint>
          )}
        </label>
        <ActionButton onClick={() => canSave && onSave(trimmed)} disabled={!canSave}>
          저장
        </ActionButton>
      </form>
    </BottomSheet>
  )
}
