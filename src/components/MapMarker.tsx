import { Icon } from './Icon'
import type { Place } from '../types'

export function MapMarker({
  place,
  completed,
  showFootprints,
  showAreas,
  onSelect,
}: {
  place: Place
  completed: boolean
  showFootprints: boolean
  showAreas: boolean
  onSelect: (place: Place) => void
}) {
  const isComplete = completed
  if (isComplete && !showFootprints) return null
  if (place.status === 'available' && !isComplete && !showAreas) return null

  return (
    <button
      className={`map-marker ${isComplete ? 'completed' : place.status}`}
      style={{ top: place.top, left: place.left }}
      onClick={() => onSelect(place)}
      type="button"
      aria-label={`${place.name} ${isComplete ? '학습 완료' : place.status === 'available' ? '학습 가능' : '미해금'}`}
    >
      {isComplete ? (
        <span className="footprint-pin">
          <Icon name="footprint" size={23} />
        </span>
      ) : place.status === 'available' ? (
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
