import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { LEVEL_POWER, XP_PER_LEVEL, type powerOf } from '../data/avatar'

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
          {/* 문장을 p 하나로 묶어야 굵은 글씨 앞뒤에서 줄이 엉뚱하게 꺾이지 않는다 */}
          <p>
            퀴즈를 맞히면 경험치가 쌓여요.
            <br />
            경험치 {XP_PER_LEVEL}마다 <b>레벨이 1 올라요.</b>
          </p>
        </li>
        <li>
          <span>
            <Icon name="sparkle" size={18} />
          </span>
          <p>
            장소를 학습하면
            <br />
            <b>그 장소의 아이템</b>을 얻어요.
          </p>
        </li>
        <li>
          <span>
            <Icon name="user" size={18} />
          </span>
          <p>
            아이템을 착용하면
            <br />
            <b>능력치가 전투력에 더해져요.</b>
          </p>
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
