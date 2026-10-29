import { Icon } from './Icon'
import type { Place } from '../types'

export function MapMarker({
  place,
  completed,
  open,
  showFootprints,
  showAreas,
  onSelect,
}: {
  place: Place
  completed: boolean
  /** 방문해서 열린 장소인지 (안 열렸으면 자물쇠) */
  open: boolean
  showFootprints: boolean
  showAreas: boolean
  onSelect: (place: Place) => void
}) {
  const isComplete = completed
  const state = isComplete ? 'completed' : open ? 'available' : 'locked'
  if (isComplete && !showFootprints) return null
  if (state === 'available' && !showAreas) return null

  return (
    <button
      className={`map-marker ${state}`}
      data-place={place.id}
      style={{ top: place.top, left: place.left }}
      onClick={() => onSelect(place)}
      type="button"
      aria-label={`${place.name} ${isComplete ? '학습 완료' : open ? '학습 가능' : '미해금'}`}
    >
      {isComplete ? (
        <span className="footprint-pin">
          <Icon name="footprint" size={23} />
        </span>
      ) : open ? (
        <span className="available-area">
          <span className="site-dot" />
        </span>
      ) : (
        <span className="locked-pin">
          <Icon name="lock" size={15} />
        </span>
      )}
      <span className="marker-label">{place.name}</span>
    </button>
  )
}
