import { findPlace, isPlaceOpen } from './places'
import type { StoryBookData, StoryChapter } from '../types'

// 이야기책: 학습 내용을 주제별로 묶은 책
// - 챕터에 placeId가 있으면 그 장소가 열릴 때(직접 방문, 사건은 처음부터) 챕터도 열린다.
// - 한 챕터라도 해금된 책만 책장에 나타나고, 나머지는 '총 권 수'에만 포함된다.
// - cover: 표지 색, emblem: 표지 가운데 한자

const soon = (title: string, location: string): StoryChapter => ({ title, location, unlocked: false })

export const storyBooks: StoryBookData[] = [
  {
    id: 'palaces',
    title: '조선의 궁궐',
    subtitle: '왕의 하루가 머물던 곳',
    cover: '#2f6b50',
    emblem: '宮',
    tags: ['조선', '궁궐', '왕실', '서울', '수원'],
    chapters: [
      { title: '조선의 첫 궁궐, 경복궁', location: '서울 · 경복궁', placeId: 'gyeongbokgung' },
      { title: '정조의 꿈, 수원화성', location: '수원 · 수원화성', placeId: 'suwon' },
      soon('자연을 품은 창덕궁', '서울 · 창덕궁'),
      soon('대한제국의 황궁, 덕수궁', '서울 · 덕수궁'),
      soon('왕실의 마지막 이야기', '서울 · 운현궁'),
    ],
  },
  {
    id: 'sejong',
    title: '세종 시대의 빛',
    subtitle: '백성을 위한 발명과 글자',
    cover: '#3f5f8f',
    emblem: '訓',
    tags: ['세종', '훈민정음', '한글', '과학'],
    chapters: [
      { title: '스물여덟 글자의 탄생', location: '어디서나 · 훈민정음 반포', placeId: 'hunminjeongeum' },
      soon('비의 양을 재다, 측우기', '서울 · 국립고궁박물관'),
      soon('해시계 앙부일구', '서울 · 종묘 앞'),
    ],
  },
  {
    id: 'imjin',
    title: '임진왜란 이야기',
    subtitle: '바다에서 지켜낸 조선',
    cover: '#24425f',
    emblem: '海',
    tags: ['임진왜란', '이순신', '한산도', '조선'],
    chapters: [
      soon('조선을 뒤흔든 전쟁의 시작', '부산 · 부산진성'),
      soon('옥포에서 거둔 첫 승리', '거제 · 옥포'),
      { title: '학익진의 승리, 한산도', location: '통영 · 한산도', placeId: 'hansando' },
      soon('마지막 바다, 노량', '남해 · 노량'),
    ],
  },
  {
    id: 'independence',
    title: '독립운동의 길',
    subtitle: '자유를 향해 걸었던 사람들',
    cover: '#8f3b30',
    emblem: '光',
    tags: ['독립운동', '근현대사', '천안', '대한민국', '3·1 운동', '유관순', '아우내'],
    chapters: [
      { title: '기억의 문을 열다', location: '천안 · 독립기념관', placeId: 'independence' },
      { title: '만세 소리가 울린 거리', location: '천안 병천 · 아우내 장터', placeId: 'aunae' },
      soon('임시정부의 발자취', '서울 · 경교장'),
      soon('감옥에서도 꺾이지 않은 뜻', '서울 · 서대문형무소'),
    ],
  },
  {
    id: 'silla',
    title: '신라 천년의 보물',
    subtitle: '경주에 남은 천년의 시간',
    cover: '#a8792c',
    emblem: '佛',
    tags: ['신라', '경주', '불국사'],
    chapters: [
      { title: '돌로 지은 이상 세계, 불국사', location: '경주 · 불국사', placeId: 'bulguksa' },
      soon('별을 보던 탑, 첨성대', '경주 · 첨성대'),
      soon('돌 속의 부처, 석굴암', '경주 · 석굴암'),
    ],
  },
  // 아직 발견하지 않은 이야기책 (책장에는 숨겨지고 총 권 수에만 포함)
  {
    id: 'goguryeo',
    title: '고구려의 기상',
    subtitle: '고구려 사람들의 이야기',
    cover: '#5a3a6b',
    emblem: '高',
    tags: ['고구려'],
    chapters: [soon('광개토대왕릉비', '중국 지린성'), soon('장수왕의 남진', '충주 · 고구려비')],
  },
  {
    id: 'baekje',
    title: '백제의 미소',
    subtitle: '백제 사람들의 이야기',
    cover: '#4f7a6a',
    emblem: '濟',
    tags: ['백제'],
    chapters: [soon('웅진 시대', '공주 · 공산성'), soon('사비의 꽃', '부여 · 정림사지')],
  },
  {
    id: 'gaya',
    title: '철의 나라 가야',
    subtitle: '가야 사람들의 이야기',
    cover: '#6b5a45',
    emblem: '鐵',
    tags: ['가야'],
    chapters: [soon('김수로왕 이야기', '김해 · 수로왕릉'), soon('대가야의 왕릉', '고령 · 지산동 고분군')],
  },
  {
    id: 'goryeo',
    title: '고려의 하늘길',
    subtitle: '고려 사람들의 이야기',
    cover: '#3d7a8a',
    emblem: '麗',
    tags: ['고려'],
    chapters: [soon('팔만대장경', '합천 · 해인사'), soon('강화도의 고려', '강화 · 고려궁지')],
  },
  {
    id: 'scientists',
    title: '조선의 과학자들',
    subtitle: '조선의 발명과 과학',
    cover: '#5f6b2f',
    emblem: '器',
    tags: ['과학'],
    chapters: [soon('장영실의 자격루', '서울 · 덕수궁'), soon('대동여지도', '서울 · 국립중앙박물관')],
  },
  {
    id: 'modern',
    title: '개항과 근대의 문',
    subtitle: '바깥 세상과 만난 조선',
    cover: '#7a4a5a',
    emblem: '門',
    tags: ['근대'],
    chapters: [soon('강화도 조약', '강화 · 연무당 옛터'), soon('대한제국 선포', '서울 · 환구단')],
  },
]

/** 챕터 해금 여부: 장소가 연결돼 있으면 그 장소가 열렸는지 따른다 */
export function isChapterUnlocked(chapter: StoryChapter, visitedIds: string[]): boolean {
  if (chapter.placeId) {
    const place = findPlace(chapter.placeId)
    return place ? isPlaceOpen(place, visitedIds) : false
  }
  return chapter.unlocked ?? false
}

/** 책장에 보이는 책 (한 챕터라도 해금된 책) */
export function isBookDiscovered(book: StoryBookData, visitedIds: string[]) {
  return book.chapters.some((chapter) => isChapterUnlocked(chapter, visitedIds))
}

/** 학습을 마친 챕터 수 */
export function readCount(book: StoryBookData, completedIds: string[]) {
  return book.chapters.filter((chapter) => chapter.placeId && completedIds.includes(chapter.placeId)).length
}

/** 모든 이야기책에서 학습을 마친 챕터 수 (내 정보 '읽은 이야기') */
export function totalReadCount(completedIds: string[]) {
  return storyBooks.reduce((sum, book) => sum + readCount(book, completedIds), 0)
}

/**
 * 지금 열린 챕터를 모두 읽은 책인지 (배지 '이야기책 완독')
 * 장소가 아직 없는 '곧 찾아올' 챕터는 읽을 수 없으므로 세지 않는다.
 */
export function isBookCaughtUp(book: StoryBookData, completedIds: string[], visitedIds: string[]) {
  const open = book.chapters.filter((chapter) => chapter.placeId && isChapterUnlocked(chapter, visitedIds))
  return open.length > 0 && open.every((chapter) => completedIds.includes(chapter.placeId!))
}
