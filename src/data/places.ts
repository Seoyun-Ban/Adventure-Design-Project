import { distanceMeters, toMapPosition } from '../lib/geo'
import type { Place } from '../types'

// 지도에 표시되는 역사 장소 목록
// 새 장소를 추가하려면: 1) 여기에 장소 추가 2) data/contents.ts에 학습 콘텐츠 추가
// lat/lng는 실제 위치(구글 지도에서 우클릭 → 좌표 복사). 지도 위 위치(top/left)는 자동으로 계산한다.
// 좌표 확인: OpenStreetMap(Nominatim) 검색, 독립기념관·아우내·불국사는 구글 지도 플러스 코드 (2026-10-30). 확인 결과는 docs/TEAM_GUIDE.md의 '해금 좌표' 표에 정리
// 넓은 장소는 unlockPoints에 해금 지점을 여러 개 둔다 (하나라도 반경 안이면 열림)

type PlaceInput = Omit<Place, 'top' | 'left'>

const placeList: PlaceInput[] = [
  {
    id: 'gyeongbokgung',
    name: '경복궁',
    region: '서울',
    // 근정전 기준 (OSM '근정전')
    lat: 37.5785,
    lng: 126.977,
    unlockPoints: [
      { name: '광화문', lat: 37.5759, lng: 126.9768 },
      { name: '근정전', lat: 37.5785, lng: 126.977 },
    ],
    summary: '조선 왕조의 첫 궁궐,\n왕의 하루를 따라가 볼까요?',
  },
  {
    // 화성행궁이 대표 위치. 성곽 둘레가 약 5.7km라 행궁과 네 성문을 해금 지점으로 두고 지점마다 기본 반경(500m)을 쓴다
    id: 'suwon',
    name: '수원화성',
    region: '수원',
    lat: 37.2822,
    lng: 127.0144,
    unlockPoints: [
      { name: '화성행궁', lat: 37.2822, lng: 127.0144 },
      { name: '장안문', lat: 37.2888, lng: 127.0142 },
      { name: '팔달문', lat: 37.2776, lng: 127.0168 },
      { name: '창룡문', lat: 37.2878, lng: 127.0251 },
      { name: '화서문', lat: 37.2856, lng: 127.0097 },
    ],
    summary: '정조의 꿈이 담긴 성곽,\n과학적인 비밀을 만나보세요.',
  },
  {
    // 넓은 부지라 반경을 넓게 잡는다
    id: 'independence',
    name: '독립기념관',
    region: '천안',
    // 겨레의집 (구글 지도 플러스 코드 8Q89Q6MF+665)
    lat: 36.78301,
    lng: 127.22311,
    radius: 800,
    summary: '우리의 자유를 지킨 사람들,\n가까이에서 이야기를 만나보세요.',
  },
  {
    // 지금의 병천시장 (구글 지도 플러스 코드 8Q89Q76X+FF2)
    id: 'aunae',
    name: '아우내 장터',
    region: '천안 병천',
    lat: 36.76114,
    lng: 127.29864,
    summary: '태극기를 들고 외친 만세,\n유관순의 이야기를 만나보세요.',
  },
  {
    id: 'bulguksa',
    name: '불국사',
    region: '경주',
    // 대웅전 (구글 지도 플러스 코드 8Q7FQ8RJ+2RP)
    lat: 35.79009,
    lng: 129.33208,
    summary: '돌과 나무로 만든 이상 세계,\n신라의 아름다움을 발견해요.',
  },
  {
    // 한산도 제승당. 섬 안이면 열리도록 반경을 넓게 잡는다
    id: 'hansando',
    name: '한산도',
    region: '통영',
    lat: 34.7943,
    lng: 128.4719,
    radius: 1000,
    summary: '학이 날개를 펴듯 적을 에워싼,\n바다 위의 큰 승리를 만나보세요.',
  },
]

export const places: Place[] = placeList.map((place) => ({
  ...place,
  ...toMapPosition({ lat: place.lat, lng: place.lng }),
}))

/** 근처 장소 알림·방문 판정 기본 반경 (기획서 기준 500m) */
export const NEARBY_RADIUS_M = 500

/** 처음 시작할 때 이미 방문한 장소 (경복궁·수원화성은 학습까지 마친 상태로, 불국사는 열리기만 한 상태로 시작) */
export const DEMO_VISITED_IDS = ['gyeongbokgung', 'suwon', 'bulguksa']

/** 장소가 열렸는지 (학습할 수 있는지): 직접 가서 반경 안에 들어간 적이 있어야 한다 (방문한 장소 id만 저장) */
export function isPlaceOpen(place: Place, visitedIds: string[]) {
  return visitedIds.includes(place.id)
}

/** 내 위치가 장소의 해금 지점 중 하나라도 반경 안인지 (지점이 없으면 lat/lng 하나만 본다) */
export function isInsideUnlockArea(place: Place, here: { lat: number; lng: number }) {
  const radius = place.radius ?? NEARBY_RADIUS_M
  const points: { lat: number; lng: number; radius?: number }[] =
    place.unlockPoints ?? [{ lat: place.lat, lng: place.lng }]
  return points.some((point) => distanceMeters(here, point) <= (point.radius ?? radius))
}

/**
 * 위치 고르기 창에서 고른 곳의 실제 좌표. 값은 장소 id, 또는 해금 지점까지 고른 '장소id#지점이름'.
 * 지점을 안 고르면 장소의 대표 위치(lat/lng)를 쓴다.
 */
export function pretendSpot(key: string) {
  const [id, pointName] = key.split('#')
  const place = findPlace(id)
  const point = place?.unlockPoints?.find((item) => item.name === pointName)
  const spot = point ?? place
  return spot ? { lat: spot.lat, lng: spot.lng } : undefined
}

export function findPlace(id: string) {
  return places.find((place) => place.id === id)
}
