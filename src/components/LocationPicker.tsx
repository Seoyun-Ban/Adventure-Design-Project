import { Icon } from './Icon'
import { BottomSheet } from './BottomSheet'
import { places } from '../data/places'

// 지도 제목을 5번 빠르게 누르면 열리는 위치 고르기 창
// 고른 장소에 서 있는 것처럼 동작한다 (해금·근처 알림까지). 고른 위치는 저장하지 않는다.
export function LocationPicker({
  currentId,
  onPick,
  onUseReal,
  onClose,
}: {
  /** 지금 고른 곳: 장소 id 또는 '장소id#지점이름' (실제 위치를 쓰고 있으면 없음) */
  currentId?: string
  onPick: (key: string) => void
  onUseReal: () => void
  onClose: () => void
}) {
  // 해금 지점이 여러 개인 장소는 지점마다 한 줄 ("경복궁 · 광화문")
  const options = places
    .flatMap((place) =>
      place.unlockPoints && place.unlockPoints.length > 1
        ? place.unlockPoints.map((point) => ({
            key: `${place.id}#${point.name}`,
            label: `${place.name} · ${point.name}`,
            region: place.region,
          }))
        : [{ key: place.id, label: place.name, region: place.region }],
    )
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
        {options.map((option) => (
          <button
            type="button"
            key={option.key}
            className={currentId === option.key ? 'active' : ''}
            onClick={() => onPick(option.key)}
          >
            <Icon name="map" size={18} />
            <span>
              <strong>{option.label}</strong>
              <small>{option.region}</small>
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
