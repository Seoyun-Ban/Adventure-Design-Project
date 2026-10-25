import type { AvatarLook, Equipped, HistoryItem } from '../types'

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
  },
  {
    id: 'liberation-cap',
    name: '독립군의 군모',
    shortName: '독립군 군모',
    category: '장비',
    symbol: '帽',
    placeId: 'independence',
    rarity: '희귀',
    description: '나라를 되찾기 위해 먼 길을 걸었던 독립군의 모자.',
    stats: { 공격: 52, 방어: 46, 지혜: 70 },
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
  },
  {
    id: 'manse-flag',
    name: '만세 태극기',
    shortName: '만세 태극기',
    category: '무기',
    symbol: '旗',
    placeId: 'aunae',
    rarity: '전설',
    description: '유관순이 아우내 장터에서 사람들에게 나누어 준 태극기를 떠올리게 하는 깃발.',
    stats: { 공격: 42, 방어: 64, 지혜: 90 },
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
    look: { gender: '남', body: '튼튼', hair: '짧은 머리', skin: '#e8b48a' },
    equipped: { 장비: 'helmet', 무기: 'jeongjo-bow', 의복: 'armor' },
  },
  {
    id: 'seoyeon',
    name: '서연 탐험가',
    level: 5,
    title: '궁궐 박사',
    color: 'red',
    look: { gender: '여', body: '보통', hair: '긴 머리', skin: '#f2c9a0' },
    equipped: { 장비: 'gat', 무기: 'brush', 의복: 'official-robe' },
  },
  {
    id: 'jiho',
    name: '지호 탐험가',
    level: 3,
    title: '신라의 별',
    color: 'gold',
    look: { gender: '남', body: '마름', hair: '상투·쪽머리', skin: '#d9a47c' },
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

export const defaultLook: AvatarLook = { gender: '남', body: '보통', hair: '짧은 머리', skin: '#f2c9a0' }

export function findItem(id?: string) {
  return historyItems.find((item) => item.id === id)
}

/** 착용한 아이템 능력치 합계 */
export function totalPower(equipped: Equipped) {
  return Object.values(equipped).reduce((sum, id) => {
    const item = findItem(id)
    return item ? sum + item.stats.공격 + item.stats.방어 + item.stats.지혜 : sum
  }, 100)
}
