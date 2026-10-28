import { Icon } from './Icon'
import { BottomSheet } from './BottomSheet'
import { places } from '../data/places'

// 지도 제목을 5번 빠르게 누르면 열리는 위치 고르기 창
// 고른 장소에 서 있는 것처럼 동작한다 (해금·근처 알림·사건 발자국 시·도까지). 고른 위치는 저장하지 않는다.
export function LocationPicker({
  currentId,
  onPick,
  onUseReal,
  onClose,
}: {
  /** 지금 고른 장소 (실제 위치를 쓰고 있으면 없음) */
  currentId?: string
  onPick: (placeId: string) => void
  onUseReal: () => void
  onClose: () => void
}) {
  const sites = places.filter((place) => place.kind === 'site')
  return (
    <BottomSheet title="어디에 있나요?" onClose={onClose}>
      <div className="location-picker">
        <button type="button" className={!currentId ? 'active' : ''} onClick={onUseReal}>
          <Icon name="locate" size={18} />
          <span>
            <strong>실제 내 위치</strong>
            <small>휴대폰 위치를 그대로 써요</small>
          </span>
        </button>
        {sites.map((place) => (
          <button
            type="button"
            key={place.id}
            className={currentId === place.id ? 'active' : ''}
            onClick={() => onPick(place.id)}
          >
            <Icon name="map" size={18} />
            <span>
              <strong>{place.name}</strong>
              <small>{place.region}</small>
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
