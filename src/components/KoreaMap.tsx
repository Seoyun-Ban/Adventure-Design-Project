import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from 'react'
import southKoreaMap from '@svg-maps/south-korea'
import { Icon } from './Icon'
import { MapMarker } from './MapMarker'
import { CURRENT_LOCATION, places } from '../data/places'
import type { LearningRecord, Place } from '../types'

/** 지도 스테이지 크기 (index.css의 .offline-map-stage와 같아야 함) */
const STAGE_WIDTH = 524
const STAGE_HEIGHT = 631

export function KoreaMap({
  records,
  showFootprints,
  showAreas,
  onSelect,
}: {
  records: LearningRecord[]
  showFootprints: boolean
  showAreas: boolean
  onSelect: (place: Place) => void
}) {
  const baseZoom = 0.61
  const [zoom, setZoom] = useState(baseZoom)
  const [pan, setPan] = useState({ x: 0, y: 12 })
  const [dragging, setDragging] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gestureStart = useRef({ x: 0, y: 0, panX: 0, panY: 0, distance: 0, zoom: baseZoom })
  const moved = useRef(false)

  const clampZoom = (value: number) => Math.min(baseZoom * 6, Math.max(baseZoom, value))
  const clampPan = (value: number, scale: number) => {
    const limit = 170 + scale * 185
    return Math.min(limit, Math.max(-limit, value))
  }

  function startPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setDragging(true)
    if (pointers.current.size === 1) {
      gestureStart.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
        distance: 0,
        zoom,
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gestureStart.current = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        panX: pan.x,
        panY: pan.y,
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
      }
    }
  }

  function movePointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    if (points.length === 1) {
      const dx = points[0].x - gestureStart.current.x
      const dy = points[0].y - gestureStart.current.y
      if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true
      setPan({
        x: clampPan(gestureStart.current.panX + dx, zoom),
        y: clampPan(gestureStart.current.panY + dy, zoom),
      })
    } else if (points.length === 2) {
      moved.current = true
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const nextZoom = clampZoom(gestureStart.current.zoom * (distance / gestureStart.current.distance))
      const centerX = (points[0].x + points[1].x) / 2
      const centerY = (points[0].y + points[1].y) / 2
      setZoom(nextZoom)
      setPan({
        x: clampPan(gestureStart.current.panX + centerX - gestureStart.current.x, nextZoom),
        y: clampPan(gestureStart.current.panY + centerY - gestureStart.current.y, nextZoom),
      })
    }
  }

  function endPointer(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 0) {
      setDragging(false)
    } else {
      const [point] = pointers.current.values()
      gestureStart.current = { x: point.x, y: point.y, panX: pan.x, panY: pan.y, distance: 0, zoom }
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const nextZoom = clampZoom(zoom * (event.deltaY < 0 ? 1.18 : 0.84))
    setZoom(nextZoom)
    setPan((current) => ({
      x: clampPan(current.x, nextZoom),
      y: clampPan(current.y, nextZoom),
    }))
  }

  function changeZoom(delta: number) {
    setZoom((current) => clampZoom(current + baseZoom * delta))
  }

  /** 현재 위치가 화면 가운데 오도록 확대·이동 */
  function moveToCurrentLocation() {
    const nextZoom = baseZoom * 2.5
    const offsetX = (parseFloat(CURRENT_LOCATION.left) / 100 - 0.5) * STAGE_WIDTH
    const offsetY = (parseFloat(CURRENT_LOCATION.top) / 100 - 0.5) * STAGE_HEIGHT
    setZoom(nextZoom)
    setPan({ x: clampPan(-offsetX * nextZoom, nextZoom), y: clampPan(-offsetY * nextZoom, nextZoom) })
  }

  const zoomPercentage = Math.round((zoom / baseZoom) * 100)
  const zoomRatio = zoom / baseZoom
  const overlayCompensation = 1 / Math.sqrt(zoomRatio)

  return (
    <div
      className={`offline-map ${dragging ? 'dragging' : ''}`}
      onPointerDown={startPointer}
      onPointerMove={movePointer}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={handleWheel}
      onClickCapture={(event) => {
        if (moved.current) {
          event.preventDefault()
          event.stopPropagation()
          moved.current = false
        }
      }}
    >
      <div
        className="offline-map-stage"
        style={
          {
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            '--map-zoom-ratio': zoomRatio,
            '--map-overlay-compensation': overlayCompensation,
            '--map-border-width': `${1.3 * overlayCompensation}px`,
            '--map-label-size': `${12 * overlayCompensation}px`,
            '--map-label-stroke': `${3 * overlayCompensation}px`,
          } as CSSProperties
        }
      >
        <svg
          className="official-korea-map"
          viewBox={southKoreaMap.viewBox}
          role="img"
          aria-label="대한민국 남한 행정구역 지도"
        >
          <defs>
            <filter id="official-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#52604f" floodOpacity=".18" />
            </filter>
          </defs>
          <g className="province-shadow">
            {southKoreaMap.locations.map((location) => (
              <path key={`shadow-${location.id}`} d={location.path} />
            ))}
          </g>
          <g className="province-shapes">
            {southKoreaMap.locations.map((location) => (
              <path key={location.id} d={location.path} data-region={location.id} />
            ))}
          </g>
          <g className="official-map-labels">
            <text x="120" y="124">
              서울
            </text>
            <text x="183" y="176">
              경기
            </text>
            <text x="310" y="94">
              강원
            </text>
            <text x="205" y="278">
              충북
            </text>
            <text x="118" y="295">
              충남
            </text>
            <text x="167" y="392">
              전북
            </text>
            <text x="121" y="502">
              전남
            </text>
            <text x="333" y="310">
              경북
            </text>
            <text x="289" y="459">
              경남
            </text>
            <text x="103" y="617">
              제주
            </text>
            <text className="dokdo-text" x="460" y="108">
              독도
            </text>
            <path className="dokdo-line" d="M484 112 516 127" />
          </g>
        </svg>
        {places.map((place) => {
          const record = records.find((item) => item.placeId === place.id)
          // 위치가 없는 사건(event)은 학습한 곳에 발자국을 찍고, 학습 전에는 지도에 표시하지 않는다
          if (place.kind === 'event' && !record) return null
          const position =
            place.kind === 'event'
              ? { top: record?.top ?? CURRENT_LOCATION.top, left: record?.left ?? CURRENT_LOCATION.left }
              : place
          return (
            <MapMarker
              key={place.id}
              place={{ ...place, ...position }}
              completed={Boolean(record)}
              showFootprints={showFootprints}
              showAreas={showAreas}
              onSelect={onSelect}
            />
          )
        })}
        <div className="current-location" style={CURRENT_LOCATION}>
          <span />
          <i />
        </div>
      </div>
      <div className="map-gesture-hint">드래그로 이동 · 핀치/휠로 확대</div>
      <div className="zoom-controls">
        <button type="button" onClick={() => changeZoom(0.5)} aria-label="확대">
          <Icon name="plus" size={21} />
        </button>
        <span className="zoom-value">{Math.max(100, Math.min(600, zoomPercentage))}%</span>
        <button type="button" onClick={() => changeZoom(-0.5)} aria-label="축소">
          <Icon name="minus" size={21} />
        </button>
        <button type="button" onClick={moveToCurrentLocation} aria-label="현재 위치로 이동">
          <Icon name="locate" size={21} />
        </button>
      </div>
    </div>
  )
}
