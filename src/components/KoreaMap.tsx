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
import { isPlaceOpen, places } from '../data/places'
import { regionMapPosition } from '../lib/regions'
import { toMapPosition, toMapXY, type LatLng } from '../lib/geo'
import { frameScale } from '../lib/frameScale'
import type { LearningRecord, Place } from '../types'

/** 지도 스테이지 크기 (index.css의 .offline-map-stage와 같아야 함) */
const STAGE_WIDTH = 524
const STAGE_HEIGHT = 631

/**
 * 표시(발자국 핀·이름표)끼리 이 거리(지도 그림 단위, 확대 보정 전)보다 가까우면 서로 밀어낸다.
 * 독립기념관과 아우내 장터처럼 실제로 몇 km 떨어진 곳은 전국 지도에서 겹쳐 보이기 때문이다.
 */
const MARKER_GAP = 58

type MapPoint = {
  place: Place
  completed: boolean
  open: boolean
  /** 표시를 그릴 위치 */
  x: number
  y: number
  /** 실제 위치 */
  trueX: number
  trueY: number
  /** 겹쳐서 실제 위치에서 옮겼는지 */
  moved: boolean
}

/** 가까운 표시끼리 서로 반씩 밀어내기를 몇 번 되풀이해서 겹치지 않게 한다 */
function spreadMarkers(points: MapPoint[], minDistance: number): MapPoint[] {
  const result = points.map((point) => ({ ...point }))
  for (let round = 0; round < 12; round += 1) {
    let changed = false
    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        const a = result[i]
        const b = result[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy)
        if (distance >= minDistance - 0.01) continue
        // 같은 자리면 옆으로 나란히
        const [ux, uy] = distance > 0.01 ? [dx / distance, dy / distance] : [1, 0]
        const push = (minDistance - distance) / 2
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
        changed = true
      }
    }
    if (!changed) break
  }
  return result.map((point) => ({
    ...point,
    moved: Math.hypot(point.x - point.trueX, point.y - point.trueY) > 0.5,
  }))
}

const toPercent = (x: number, y: number) => ({
  top: `${((y / STAGE_HEIGHT) * 100).toFixed(3)}%`,
  left: `${((x / STAGE_WIDTH) * 100).toFixed(3)}%`,
})

/** 울릉도가 들어 있는 경상북도 모양 (삽입 지도에서 울릉도 부분만 잘라 보여준다) */
const ulleungPath = southKoreaMap.locations.find((location) => location.id === 'north-gyeongsang')?.path ?? ''

export function KoreaMap({
  records,
  visitedIds,
  showFootprints,
  showAreas,
  me,
  onSelect,
  onNotice,
}: {
  records: LearningRecord[]
  /** 방문해서 열린 장소 id */
  visitedIds: string[]
  showFootprints: boolean
  showAreas: boolean
  /** 실제 내 위치 (모르면 null → 내 위치 점을 숨긴다) */
  me: LatLng | null
  onSelect: (place: Place) => void
  onNotice: (message: string) => void
}) {
  const mePosition = me ? toMapPosition(me) : null
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
      // 컴퓨터에서 틀이 줄어 있으면 마우스 이동 거리를 틀 안 거리로 바꾼다
      const dx = (points[0].x - gestureStart.current.x) / frameScale()
      const dy = (points[0].y - gestureStart.current.y) / frameScale()
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
    if (!mePosition) {
      onNotice('아직 내 위치를 몰라요. 위치를 켜 주세요.')
      return
    }
    const nextZoom = baseZoom * 2.5
    const offsetX = (parseFloat(mePosition.left) / 100 - 0.5) * STAGE_WIDTH
    const offsetY = (parseFloat(mePosition.top) / 100 - 0.5) * STAGE_HEIGHT
    setZoom(nextZoom)
    setPan({ x: clampPan(-offsetX * nextZoom, nextZoom), y: clampPan(-offsetY * nextZoom, nextZoom) })
  }

  const zoomPercentage = Math.round((zoom / baseZoom) * 100)
  const zoomRatio = zoom / baseZoom
  const overlayCompensation = 1 / Math.sqrt(zoomRatio)

  // 지도에 보일 표시들 (지도 그림 단위 좌표)
  const markers = spreadMarkers(
    places.flatMap((place) => {
      const record = records.find((item) => item.placeId === place.id)
      // 위치가 없는 사건(event)은 학습한 시·도에 발자국을 찍고, 학습 전에는 지도에 표시하지 않는다
      if (place.kind === 'event' && !record) return []
      const position =
        place.kind === 'event'
          ? record?.top && record.left && !record.region
            ? { top: record.top, left: record.left }
            : regionMapPosition(record?.region)
          : place
      const completed = Boolean(record)
      const open = isPlaceOpen(place, visitedIds)
      // 버튼으로 꺼 둔 표시는 밀어내기 계산에서도 뺀다 (MapMarker의 보이기 규칙과 같다)
      if (completed && !showFootprints) return []
      if (!completed && open && !showAreas) return []
      const x = (parseFloat(position.left) / 100) * STAGE_WIDTH
      const y = (parseFloat(position.top) / 100) * STAGE_HEIGHT
      return [{ place, completed, open, x, y, trueX: x, trueY: y, moved: false }]
    }),
    MARKER_GAP * overlayCompensation,
  )

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
            {/* 이 섬은 지도 그림 안에 실제 위치로 들어 있는 울릉도 */}
            <text className="dokdo-text" x="460" y="108">
              울릉도
            </text>
            <path className="dokdo-line" d="M484 112 512 126" />
          </g>
          <UlleungDokdoInset ulleungPath={ulleungPath} />
        </svg>
        {/* 너무 가까워 겹치는 표시는 살짝 떨어뜨리고, 실제 위치까지 점선으로 잇는다 */}
        <svg className="marker-leaders" viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} aria-hidden="true">
          {markers
            .filter((marker) => marker.moved)
            .map((marker) => (
              <g key={marker.place.id}>
                <line x1={marker.trueX} y1={marker.trueY} x2={marker.x} y2={marker.y} />
                <circle cx={marker.trueX} cy={marker.trueY} r={2.2 * overlayCompensation} />
              </g>
            ))}
        </svg>
        {markers.map((marker) => (
          <MapMarker
            key={marker.place.id}
            place={{ ...marker.place, ...toPercent(marker.x, marker.y) }}
            completed={marker.completed}
            open={marker.open}
            showFootprints={showFootprints}
            showAreas={showAreas}
            onSelect={onSelect}
          />
        ))}
        {mePosition && (
          <div className="current-location" style={mePosition} aria-label="내 위치">
            <span />
            <i />
          </div>
        )}
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

/** 울릉도 (섬 가운데)와 독도 (동도·서도 사이) */
const ULLEUNG = { lat: 37.4993, lng: 130.8634 }
const DOKDO = { lat: 37.2418, lng: 131.867 }

/**
 * 오른쪽 위 삽입 지도: 울릉도와 독도를 본 지도와 같은 축척·같은 방향으로 함께 보여준다.
 * 독도는 지도 그림 오른쪽 경계 밖이라 본 지도에는 그릴 수 없어서, 바다 위 빈 곳에 네모 칸을 둔다.
 * 칸 안의 위치는 위도·경도 계산식(lib/geo.ts)으로 정하므로 두 섬의 거리와 방향이 실제와 같다 (약 87km).
 */
function UlleungDokdoInset({ ulleungPath }: { ulleungPath: string }) {
  const u = toMapXY(ULLEUNG)
  const d = toMapXY(DOKDO)
  const pad = 9
  const left = u.x - 9
  const top = u.y - 9
  const width = d.x + 8 - left + pad * 2
  const height = d.y + 22 - top + pad * 2
  const boxX = 521 - width
  const boxY = 6
  // 칸 안으로 옮기기 (크기는 그대로 = 본 지도와 같은 축척)
  const shiftX = boxX + pad - left
  const shiftY = boxY + pad - top
  const ux = u.x + shiftX
  const uy = u.y + shiftY
  const dx = d.x + shiftX
  const dy = d.y + shiftY
  return (
    <g className="map-inset" aria-label="울릉도와 독도 삽입 지도">
      <defs>
        <clipPath id="ulleung-dokdo-clip">
          <rect x={boxX} y={boxY} width={width} height={height} rx="7" />
        </clipPath>
      </defs>
      <rect className="map-inset-box" x={boxX} y={boxY} width={width} height={height} rx="7" />
      <g clipPath="url(#ulleung-dokdo-clip)">
        <path className="map-inset-land" d={ulleungPath} transform={`translate(${shiftX} ${shiftY})`} />
        <path className="map-inset-route" d={`M${ux + 5} ${uy + 2} L${dx - 4} ${dy - 1}`} />
        {/* 독도: 동도와 서도 두 섬 (실제로는 아주 작아서 보이도록 크게 그린다) */}
        <circle className="map-inset-dokdo" cx={dx - 1.6} cy={dy} r="1.9" />
        <circle className="map-inset-dokdo" cx={dx + 1.8} cy={dy + 0.4} r="1.6" />
        <text className="map-inset-label" x={ux} y={uy + 16}>
          울릉도
        </text>
        <text className="map-inset-label strong" x={dx} y={dy + 15}>
          독도
        </text>
        <text className="map-inset-distance" x={(ux + dx) / 2 + 4} y={(uy + dy) / 2 - 5}>
          약 87km
        </text>
      </g>
    </g>
  )
}
