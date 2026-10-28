import { characterStyles, styleIdFor, stylesFor } from '../data/avatar'
import type { AvatarLook } from '../types'

/** 이름표 + 여러 버튼 중 하나 고르기 (온보딩, 개인정보 고치기) */
export function OptionRow<T extends string>({
  label,
  options,
  value,
  labelOf = (option) => option,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  /** 버튼에 보일 이름 (값과 다를 때) */
  labelOf?: (option: T) => string
  onChange: (value: T) => void
}) {
  return (
    <div className="option-row">
      <span>{label}</span>
      <div className="settings-segments">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={value === option ? 'active' : ''}
            onClick={() => onChange(option)}
          >
            {labelOf(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** 성별과 머리 모양 고르기. 성별을 바꾸면 그 성별의 첫 머리 모양으로 바뀐다 */
export function LookFields({ look, onChange }: { look: AvatarLook; onChange: (look: AvatarLook) => void }) {
  return (
    <>
      <OptionRow
        label="성별"
        options={['남', '여'] as const}
        value={look.gender}
        onChange={(gender) => onChange({ ...look, gender, style: stylesFor(gender)[0] })}
      />
      <OptionRow
        label="머리 모양"
        options={stylesFor(look.gender)}
        value={styleIdFor(look)}
        labelOf={(id) => characterStyles[id].label}
        onChange={(style) => onChange({ ...look, style })}
      />
    </>
  )
}
