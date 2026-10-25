import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import type { Place } from '../types'

export function CompleteModal({
  place,
  onConfirm,
  onQuiz,
}: {
  place: Place
  onConfirm: () => void
  onQuiz: () => void
}) {
  return (
    <div className="modal-layer">
      <div className="confetti c1" />
      <div className="confetti c2" />
      <div className="confetti c3" />
      <div className="confetti c4" />
      <section className="complete-modal">
        <span className="modal-rays" />
        <div className="earned-footprint">
          <Icon name="footprint" size={52} />
        </div>
        <p className="eyebrow">새로운 역사를 새겼어요</p>
        <h2>발자국을 획득했어요!</h2>
        <p>
          {place.name}의 이야기가
          <br />
          나의 역사 지도에 기록되었습니다.
        </p>
        <div className="earned-place">
          <span>새 발자국</span>
          <strong>{place.name}</strong>
          <small>{place.region}</small>
        </div>
        <div className="complete-actions">
          <ActionButton variant="secondary" onClick={onConfirm}>
            <Icon name="map" size={18} /> 지도에서 확인
          </ActionButton>
          <ActionButton onClick={onQuiz}>
            퀴즈 풀어보기 <Icon name="chevron" size={18} />
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
