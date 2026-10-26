import { itemsForPlace } from '../data/avatar'

// 이 장소를 학습하면 얻는 아이템 (지도 장소 카드, 학습 화면 위쪽)
// 아이템은 장소 학습을 마치면 얻으므로, 학습을 마친 장소면 '획득 완료'로 보여준다.
export function PlaceItems({
  placeId,
  owned,
  className = '',
}: {
  placeId: string
  owned: boolean
  className?: string
}) {
  const items = itemsForPlace(placeId)
  if (items.length === 0) return null
  return (
    <div className={`place-items ${owned ? 'owned' : ''} ${className}`}>
      <span className="place-items-label">이곳에서 얻는 아이템</span>
      <span className="place-items-names">
        {items.map((item) => (
          <span key={item.id} className="place-item-chip">
            <b aria-hidden="true">{item.symbol}</b>
            {item.shortName}
          </span>
        ))}
      </span>
      {owned && <span className="place-items-done">획득 완료</span>}
    </div>
  )
}
