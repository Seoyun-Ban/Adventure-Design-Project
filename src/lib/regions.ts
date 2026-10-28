import southKoreaMap from '@svg-maps/south-korea'
import { distanceMeters, toMapPosition, toMapXY, type LatLng } from './geo'

// 시·도 (지도 그림의 지역 17곳)
// 위치가 없는 사건(훈민정음 반포 등)의 발자국은 정확한 위치 대신 '학습할 때 있던 시·도'만 저장하고,
// 지도에는 그 시·도의 대표 지점에 찍는다.
// 대표 지점은 시청·도청 근처로 하되, 다른 학습 장소 마커와 겹치지 않게 조금 옮긴 곳도 있다.

export const REGIONS: Record<string, { name: string; point: LatLng }> = {
  seoul: { name: '서울', point: { lat: 37.53, lng: 127.06 } },
  busan: { name: '부산', point: { lat: 35.1798, lng: 129.075 } },
  daegu: { name: '대구', point: { lat: 35.8714, lng: 128.6014 } },
  incheon: { name: '인천', point: { lat: 37.4563, lng: 126.7052 } },
  gwangju: { name: '광주', point: { lat: 35.1595, lng: 126.8526 } },
  daejeon: { name: '대전', point: { lat: 36.3504, lng: 127.3845 } },
  ulsan: { name: '울산', point: { lat: 35.5384, lng: 129.3114 } },
  sejong: { name: '세종', point: { lat: 36.48, lng: 127.289 } },
  gyeonggi: { name: '경기', point: { lat: 37.7381, lng: 127.0337 } },
  gangwon: { name: '강원', point: { lat: 37.8813, lng: 127.7298 } },
  'north-chungcheong': { name: '충북', point: { lat: 36.6358, lng: 127.4914 } },
  'south-chungcheong': { name: '충남', point: { lat: 36.6588, lng: 126.6728 } },
  'north-jeolla': { name: '전북', point: { lat: 35.8242, lng: 127.148 } },
  'south-jeolla': { name: '전남', point: { lat: 34.8161, lng: 126.4629 } },
  'north-gyeongsang': { name: '경북', point: { lat: 36.576, lng: 128.5056 } },
  'south-gyeongsang': { name: '경남', point: { lat: 35.2383, lng: 128.6924 } },
  jeju: { name: '제주', point: { lat: 33.4996, lng: 126.5312 } },
}

/** 위치를 모를 때 쓰는 시·도 */
export const DEFAULT_REGION = 'seoul'

let paths: { id: string; element: SVGPathElement }[] | null = null

/** 지도 그림의 시·도 모양을 화면 밖에 한 번 만들어 둔다 (점이 어느 시·도 안인지 확인용) */
function regionPaths() {
  if (paths) return paths
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', southKoreaMap.viewBox)
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
  paths = southKoreaMap.locations.map((location) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    element.setAttribute('d', location.path)
    svg.appendChild(element)
    return { id: location.id, element }
  })
  document.body.appendChild(svg)
  return paths
}

/** 이 위치가 속한 시·도 id. 바다 위 등 어느 시·도 안도 아니면 가장 가까운 시·도 */
export function regionAt(point: LatLng): string {
  const { x, y } = toMapXY(point)
  try {
    const inside = regionPaths().find(({ element }) => element.isPointInFill(new DOMPoint(x, y)))
    if (inside && REGIONS[inside.id]) return inside.id
  } catch {
    // isPointInFill을 못 쓰는 브라우저는 아래의 가장 가까운 시·도로
  }
  return Object.entries(REGIONS).reduce(
    (best, [id, region]) => {
      const distance = distanceMeters(point, region.point)
      return distance < best.distance ? { id, distance } : best
    },
    { id: DEFAULT_REGION, distance: Infinity },
  ).id
}

/** 시·도 대표 지점의 지도 위치 (top/left %) */
export function regionMapPosition(regionId: string | undefined) {
  return toMapPosition((REGIONS[regionId ?? DEFAULT_REGION] ?? REGIONS[DEFAULT_REGION]).point)
}
