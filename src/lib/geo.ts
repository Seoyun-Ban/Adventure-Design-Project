// 위도·경도 계산
// - 지도 그림(@svg-maps/south-korea, 524×631)은 웹 지도와 같은 메르카토르 방식으로 그려져 있다.
//   시·도 17곳 경계의 실제 위도·경도와 그림 위 좌표를 맞춰 아래 숫자를 구했다 (평균 오차 약 1.7px ≈ 2km).
//   x = X_SCALE × 경도 + X_OFFSET,  y = Y_SCALE × 메르카토르(위도) + Y_OFFSET
// - 울릉도까지는 그림 안에 실제 위치로 들어 있고, 독도는 그림 밖이라 지도에서 따로 표시한다.

const X_SCALE = 93.8613
const X_OFFSET = -11766.8893
const Y_SCALE = -93.8605
const Y_OFFSET = 3937.625

/** 지도 그림 크기 (viewBox) */
export const MAP_WIDTH = 524
export const MAP_HEIGHT = 631

export type LatLng = { lat: number; lng: number }

/** 위도를 메르카토르 값(도 단위)으로 바꾼다 */
function mercator(lat: number) {
  return (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI
}

/** 위도·경도 → 지도 그림 위 좌표 (viewBox 단위) */
export function toMapXY({ lat, lng }: LatLng) {
  return { x: X_SCALE * lng + X_OFFSET, y: Y_SCALE * mercator(lat) + Y_OFFSET }
}

/** 위도·경도 → 지도 영역 기준 % 위치 (마커의 top/left) */
export function toMapPosition(point: LatLng) {
  const { x, y } = toMapXY(point)
  return { top: `${((y / MAP_HEIGHT) * 100).toFixed(2)}%`, left: `${((x / MAP_WIDTH) * 100).toFixed(2)}%` }
}

/** 두 지점 사이 거리 (미터, 지구를 공으로 보고 계산) */
export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
