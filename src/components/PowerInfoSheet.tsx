import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { LEVEL_POWER, type powerOf } from '../data/avatar'

// 전투력 올리는 방법 + 지금 내 전투력 계산 내역 (아바타 탭의 ⓘ 버튼)
export function PowerInfoSheet({
  level,
  power,
  onClose,
}: {
  level: number
  power: ReturnType<typeof powerOf>
  onClose: () => void
}) {
  return (
    <BottomSheet title="전투력을 올리는 방법" onClose={onClose}>
      <ol className="power-steps">
        <li>
          <span>
            <Icon name="footprint" size={18} />
          </span>
          역사 장소를 학습하면 <b>레벨이 올라요.</b>
        </li>
        <li>
          <span>
            <Icon name="sparkle" size={18} />
          </span>
          학습하면 그 장소의 <b>아이템을 얻어요.</b>
        </li>
        <li>
          <span>
            <Icon name="user" size={18} />
          </span>
          아이템을 착용하면 <b>능력치가 전투력에 더해져요.</b>
        </li>
      </ol>
      <div className="power-breakdown" aria-label="지금 내 전투력 계산">
        <strong>지금 내 전투력</strong>
        <div>
          <span>착용한 아이템 능력치</span>
          <b>{power.items.toLocaleString()}점</b>
        </div>
        <div>
          <span>
            레벨 {level} × {LEVEL_POWER}점
          </span>
          <b>+ {power.level.toLocaleString()}점</b>
        </div>
        <div className="total">
          <span>총 전투력</span>
          <b>{power.total.toLocaleString()}점</b>
        </div>
      </div>
    </BottomSheet>
  )
}
