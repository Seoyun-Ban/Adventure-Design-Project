import { toMapPosition } from '../lib/geo'
import type { Place } from '../types'

// 지도에 표시되는 역사 장소 목록
// 새 장소를 추가하려면: 1) 여기에 장소 추가 2) data/contents.ts에 학습 콘텐츠 추가
// lat/lng는 실제 위치(구글 지도에서 우클릭 → 좌표 복사). 지도 위 위치(top/left)는 자동으로 계산한다.
// 좌표 확인: OpenStreetMap 검색 (2026-10)

type PlaceInput = Omit<Place, 'top' | 'left'>

const placeList: PlaceInput[] = [
  {
    id: 'gyeongbokgung',
    name: '경복궁',
    region: '서울',
    status: 'available',
    kind: 'site',
    lat: 37.5798,
    lng: 126.9767,
    summary: '조선 왕조의 첫 궁궐,\n왕의 하루를 따라가 볼까요?',
  },
  {
    // 화성행궁 기준. 성곽 둘레가 약 5.7km라 반경을 넓게 잡는다
    id: 'suwon',
    name: '수원화성',
    region: '수원',
    status: 'available',
    kind: 'site',
    lat: 37.2822,
    lng: 127.0144,
    radius: 1000,
    summary: '정조의 꿈이 담긴 성곽,\n과학적인 비밀을 만나보세요.',
  },
  {
    // 넓은 부지라 반경을 넓게 잡는다
    id: 'independence',
    name: '독립기념관',
    region: '천안',
    status: 'available',
    kind: 'site',
    lat: 36.783,
    lng: 127.2249,
    radius: 800,
    summary: '우리의 자유를 지킨 사람들,\n가까이에서 이야기를 만나보세요.',
  },
  {
    // 지금의 병천시장 (충남 천안시 동남구 병천면)
    id: 'aunae',
    name: '아우내 장터',
    region: '천안 병천',
    status: 'available',
    kind: 'site',
    lat: 36.7634,
    lng: 127.2963,
    summary: '태극기를 들고 외친 만세,\n유관순의 이야기를 만나보세요.',
  },
  {
    id: 'bulguksa',
    name: '불국사',
    region: '경주',
    status: 'available',
    kind: 'site',
    lat: 35.789,
    lng: 129.3309,
    summary: '돌과 나무로 만든 이상 세계,\n신라의 아름다움을 발견해요.',
  },
  {
    // 한산도 제승당. 섬 안이면 열리도록 반경을 넓게 잡는다
    id: 'hansando',
    name: '한산도',
    region: '통영',
    status: 'locked',
    kind: 'site',
    lat: 34.7943,
    lng: 128.4719,
    radius: 1000,
    summary: '아직 안개에 가려진 이야기예요.\n한산도에 도착하면 해금됩니다.',
  },
  {
    // 위치가 분명하지 않은 사건: 어디서나 학습 가능, 학습한 곳에 발자국이 남는다
    id: 'hunminjeongeum',
    name: '훈민정음 반포',
    region: '어디서나',
    status: 'available',
    kind: 'event',
    summary: '백성을 위해 만든 스물여덟 글자,\n지금 있는 곳에서 만나보세요.',
  },
]

export const places: Place[] = placeList.map((place) => ({
  ...place,
  ...(place.lat !== undefined && place.lng !== undefined
    ? toMapPosition({ lat: place.lat, lng: place.lng })
    : { top: '0%', left: '0%' }),
}))

/** 사용자의 현재 위치 (프로토타입에서는 고정값. TODO: 실제 GPS 연동) */
export const CURRENT_LOCATION = { top: '24%', left: '26%' }

/** 근처 장소 알림·방문 판정 기본 반경 (기획서 기준 500m) */
export const NEARBY_RADIUS_M = 500

export function findPlace(id: string) {
  return places.find((place) => place.id === id)
}
