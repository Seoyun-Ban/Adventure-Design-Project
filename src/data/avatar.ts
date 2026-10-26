import type { AvatarLook, CharacterStyleId, Equipped, HistoryItem, ItemCategory } from '../types'

type Point = { x: number; y: number }

export type CharacterStyle = {
  gender: AvatarLook['gender']
  /** 온보딩 선택지에 보이는 이름 */
  label: string
  image: string
  /** 학습 영상 장면에서 등록한 얼굴 사진을 겹칠 동그라미의 가운데(x, y)와 지름(size) */
  face: Point & { size: number }
  /** 착용한 아이템 배지를 띄울 자리 (장비: 머리 근처, 무기: 손 근처, 의복: 몸 옆). 그림이 없는 아이템에 쓴다 */
  slots: Record<ItemCategory, Point>
  /**
   * 그림 아이템을 겹칠 자리
   * - head: 모자의 아래 테두리가 닿을 이마선 가운데(x, y)와 머리(머리카락 포함) 너비(w, 그림 너비 대비 %)
   * - hand: 손 아이템을 쥘 손바닥 가운데(x, y) — 화면 오른쪽 손
   */
  mounts: { head: Point & { w: number }; hand: Point }
}

/**
 * 내 캐릭터 그림 (머리 모양별). 위치 값은 모두 그림 너비·높이 대비 %.
 * 그림마다 얼굴·손 위치가 조금씩 달라서 face와 slots를 따로 맞춘다.
 * 그림을 바꾸거나 추가하면 이 값도 새 그림에 맞게 고쳐야 한다.
 * 성별마다 맨 앞에 적은 머리 모양이 기본값이다.
 */
export const characterStyles: Record<CharacterStyleId, CharacterStyle> = {
  'boy-short': {
    gender: '남',
    label: '짧은 머리',
    image: '/images/characters/me-boy-short.png',
    face: { x: 50, y: 28, size: 43 },
    slots: { 장비: { x: 88, y: 9 }, 무기: { x: 94, y: 62 }, 의복: { x: 6, y: 47 } },
    mounts: { head: { x: 50, y: 17, w: 78 }, hand: { x: 91, y: 68 } },
  },
  'boy-sangtu': {
    gender: '남',
    label: '상투',
    image: '/images/characters/me-boy-sangtu.png',
    face: { x: 50, y: 32, size: 44 },
    slots: { 장비: { x: 86, y: 12 }, 무기: { x: 94, y: 66 }, 의복: { x: 6, y: 50 } },
    mounts: { head: { x: 49, y: 24, w: 64 }, hand: { x: 92, y: 70 } },
  },
  'girl-braid': {
    gender: '여',
    label: '땋은 머리',
    image: '/images/characters/me-girl-braid.png',
    face: { x: 50, y: 24, size: 42 },
    slots: { 장비: { x: 88, y: 7 }, 무기: { x: 94, y: 58 }, 의복: { x: 6, y: 44 } },
    mounts: { head: { x: 49, y: 14, w: 62 }, hand: { x: 94, y: 64 } },
  },
  'girl-bob': {
    gender: '여',
    label: '단발',
    image: '/images/characters/me-girl-bob.png',
    face: { x: 50, y: 25, size: 43 },
    slots: { 장비: { x: 90, y: 7 }, 무기: { x: 94, y: 60 }, 의복: { x: 6, y: 45 } },
    mounts: { head: { x: 50, y: 13, w: 72 }, hand: { x: 93, y: 64 } },
  },
  'girl-long': {
    gender: '여',
    label: '장발',
    image: '/images/characters/me-girl-long.png',
    face: { x: 50, y: 25, size: 42 },
    slots: { 장비: { x: 90, y: 7 }, 무기: { x: 94, y: 60 }, 의복: { x: 6, y: 46 } },
    mounts: { head: { x: 50, y: 13, w: 70 }, hand: { x: 94, y: 63 } },
  },
}

/** 성별에 고를 수 있는 머리 모양 (맨 앞이 기본값) */
export function stylesFor(gender: AvatarLook['gender']) {
  return (Object.keys(characterStyles) as CharacterStyleId[]).filter(
    (id) => characterStyles[id].gender === gender,
  )
}

/** 외형에 맞는 머리 모양 id. 고른 적이 없거나 성별과 맞지 않으면 성별 기본값 */
export function styleIdFor(look: Pick<AvatarLook, 'gender' | 'style'>): CharacterStyleId {
  if (look.style && characterStyles[look.style].gender === look.gender) return look.style
  return stylesFor(look.gender)[0]
}

/** 외형에 맞는 캐릭터 그림 정보 */
export function characterFor(look: Pick<AvatarLook, 'gender' | 'style'>) {
  return characterStyles[styleIdFor(look)]
}

// 아바타 아이템: 연결된 장소(placeId)의 학습을 완료하면 획득한다
// 카테고리별로 착용 부위가 정해져 있다 — 장비: 머리, 무기: 손, 의복: 몸
export const historyItems: HistoryItem[] = [
  // 장비 (머리)
  {
    id: 'gat',
    name: '조선 선비의 갓',
    shortName: '선비의 갓',
    category: '장비',
    symbol: '笠',
    placeId: 'gyeongbokgung',
    rarity: '희귀',
    description: '배움과 바른 마음가짐을 소중히 여긴 선비의 갓.',
    stats: { 공격: 12, 방어: 32, 지혜: 96 },
    art: {
      kind: 'image',
      src: '/images/characters/item-gat.png',
      anchor: { x: 50, y: 60 },
      width: 1.4,
      split: 62,
      below: 'behind',
    },
  },
  {
    id: 'helmet',
    name: '조선 장군의 투구',
    shortName: '장군의 투구',
    category: '장비',
    symbol: '冑',
    placeId: 'hansando',
    rarity: '영웅',
    description: '거친 바다 위에서도 장군의 머리를 지켜준 투구.',
    stats: { 공격: 40, 방어: 88, 지혜: 50 },
    art: {
      kind: 'image',
      src: '/images/characters/item-helmet.png',
      anchor: { x: 50, y: 64 },
      width: 1.1,
      split: 67,
      below: 'hide',
    },
  },
  // 무기 (손)
  {
    id: 'jeongjo-bow',
    name: '정조의 활',
    shortName: '정조의 활',
    category: '무기',
    symbol: '弓',
    placeId: 'suwon',
    rarity: '영웅',
    description: '활쏘기 솜씨가 뛰어났던 정조를 떠올리게 하는 활.',
    stats: { 공격: 87, 방어: 25, 지혜: 62 },
    art: { kind: 'image', src: '/images/characters/item-bow.png', anchor: { x: 30, y: 52 }, height: 46 },
  },
  {
    id: 'hwarang-sword',
    name: '신라 화랑의 검',
    shortName: '화랑의 검',
    category: '무기',
    symbol: '劍',
    placeId: 'bulguksa',
    rarity: '영웅',
    description: '신라 화랑의 용기와 수련을 상징하는 곧은 검.',
    stats: { 공격: 94, 방어: 38, 지혜: 46 },
    art: { kind: 'image', src: '/images/characters/item-sword.png', anchor: { x: 50, y: 84 }, height: 38 },
  },
  {
    id: 'brush',
    name: '집현전 학자의 붓',
    shortName: '학자의 붓',
    category: '무기',
    symbol: '筆',
    placeId: 'hunminjeongeum',
    rarity: '전설',
    description: '스물여덟 글자를 세상에 남긴 붓. 지혜가 가장 큰 무기!',
    stats: { 공격: 30, 방어: 30, 지혜: 99 },
    art: { kind: 'image', src: '/images/characters/item-brush.png', anchor: { x: 50, y: 72 }, height: 30 },
  },
  {
    id: 'taegukgi',
    name: '태극기',
    shortName: '태극기',
    category: '무기',
    symbol: '旗',
    placeId: 'independence',
    rarity: '희귀',
    description: '나라를 되찾기 위해 애쓴 사람들이 소중히 지켜 낸 우리나라의 국기.',
    stats: { 공격: 52, 방어: 46, 지혜: 70 },
    art: { kind: 'taegukgi', anchor: { x: 6, y: 78 }, height: 56 },
  },
  {
    id: 'declaration',
    name: '독립선언서',
    shortName: '독립선언서',
    category: '무기',
    symbol: '書',
    placeId: 'aunae',
    rarity: '전설',
    description: '유관순이 고향 사람들과 함께 읽은 독립선언서. 용기가 불끈 솟아나요.',
    stats: { 공격: 42, 방어: 64, 지혜: 90 },
    art: { kind: 'declaration', anchor: { x: 50, y: 55 }, height: 20 },
  },
  // 의복 (몸)
  {
    id: 'official-robe',
    name: '조선 관리의 관복',
    shortName: '관리의 관복',
    category: '의복',
    symbol: '衣',
    placeId: 'gyeongbokgung',
    rarity: '희귀',
    description: '근정전 조회에 나서던 관리들이 입던 붉은 관복.',
    stats: { 공격: 20, 방어: 55, 지혜: 80 },
  },
  {
    id: 'hwarang-robe',
    name: '신라 화랑의 예복',
    shortName: '화랑 예복',
    category: '의복',
    symbol: '花',
    placeId: 'bulguksa',
    rarity: '전설',
    description: '젊은 화랑들이 의식에서 갖춰 입던 화려한 예복.',
    stats: { 공격: 45, 방어: 62, 지혜: 82 },
  },
  {
    id: 'armor',
    name: '이순신 장군의 갑옷',
    shortName: '장군의 갑옷',
    category: '의복',
    symbol: '鎧',
    placeId: 'hansando',
    rarity: '영웅',
    description: '한산도 바다를 지킨 장군의 굳센 기개가 깃든 갑옷.',
    stats: { 공격: 68, 방어: 92, 지혜: 55 },
  },
]

export const battleFriends = [
  {
    id: 'minjun',
    name: '민준 탐험가',
    level: 4,
    title: '성곽 수호자',
    color: 'blue',
    look: { gender: '남', style: 'boy-short', body: '튼튼', hair: '짧은 머리', skin: '#e8b48a' },
    equipped: { 장비: 'helmet', 무기: 'jeongjo-bow', 의복: 'armor' },
  },
  {
    id: 'seoyeon',
    name: '서연 탐험가',
    level: 5,
    title: '궁궐 박사',
    color: 'red',
    look: { gender: '여', style: 'girl-long', body: '보통', hair: '긴 머리', skin: '#f2c9a0' },
    equipped: { 장비: 'gat', 무기: 'brush', 의복: 'official-robe' },
  },
  {
    id: 'jiho',
    name: '지호 탐험가',
    level: 3,
    title: '신라의 별',
    color: 'gold',
    look: { gender: '남', style: 'boy-sangtu', body: '마름', hair: '상투·쪽머리', skin: '#d9a47c' },
    equipped: { 무기: 'hwarang-sword', 의복: 'hwarang-robe' },
  },
] satisfies {
  id: string
  name: string
  level: number
  title: string
  color: string
  look: AvatarLook
  equipped: Equipped
}[]

export const skinTones = ['#f6d3b3', '#f2c9a0', '#e8b48a', '#d9a47c', '#b98361']

export const defaultLook: AvatarLook = {
  gender: '남',
  style: 'boy-short',
  body: '보통',
  hair: '짧은 머리',
  skin: '#f2c9a0',
}

export function findItem(id?: string) {
  return historyItems.find((item) => item.id === id)
}

/**
 * 없어진 아이템을 새 아이템으로 바꾼다 (예전에 저장한 기록·예전 도전장 링크용)
 * - 만세 태극기(manse-flag, 손) → 독립선언서(declaration, 손)
 * - 독립군 군모(liberation-cap, 머리) → 태극기(taegukgi, 손). 손에 이미 다른 아이템이 있으면 그대로 두고 군모만 벗는다.
 */
export function migrateEquipped(equipped: Equipped): Equipped {
  const next: Equipped = { ...equipped }
  if (next.무기 === 'manse-flag') next.무기 = 'declaration'
  if (next.장비 === 'liberation-cap') {
    delete next.장비
    if (!next.무기) next.무기 = 'taegukgi'
  }
  return next
}

/** 이 장소를 학습하면 얻는 아이템 */
export function itemsForPlace(placeId: string) {
  return historyItems.filter((item) => item.placeId === placeId)
}

// ---------- 레벨과 전투력 (모든 화면이 이 함수들만 쓴다) ----------

/** 레벨 1당 더해지는 전투력 */
export const LEVEL_POWER = 60

/** 레벨 = 1 + 학습을 마친 장소 수 */
export function levelFor(completedCount: number) {
  return 1 + completedCount
}

/** 착용한 아이템 능력치(공격+방어+지혜) 합계 */
export function itemPower(equipped: Equipped) {
  return Object.values(equipped).reduce((sum, id) => {
    const item = findItem(id)
    return item ? sum + item.stats.공격 + item.stats.방어 + item.stats.지혜 : sum
  }, 0)
}

/** 전투력 = 아이템 능력치 합 + 레벨(학습량) 보너스. 계산 내역도 함께 돌려준다 */
export function powerOf(equipped: Equipped, level: number) {
  const items = itemPower(equipped)
  const levelBonus = level * LEVEL_POWER
  return { items, level: levelBonus, total: items + levelBonus }
}
