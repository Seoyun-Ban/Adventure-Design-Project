// 낱말 풀이 목록: 아이들이 다른 뜻으로 오해하거나 어려워하는 낱말을 모아 둔다.
// - 낱말을 더하려면 아래 목록에 한 줄만 추가하면 된다: { word: '낱말', hanja: '漢字', meaning: '풀이' }
//   (한자가 없으면 hanja는 빼도 된다)
// - 학습 글·'알고 있었나요?'·'외우기 한 줄'에서 이 낱말이 처음 나오는 곳에 점선 밑줄이 그어지고, 누르면 풀이가 나온다.
//   퀴즈는 문제 글에만 적용한다 (보기·정답 설명은 답을 알려줄 수 있어서 제외). 상상 대화 장면에는 적용하지 않는다.
// - 낱말 일부에는 밑줄이 그어지지 않는다 (예: '근정전' 안의 '정전', '활시위' 안의 '시위'). 규칙은 lib/glossary.ts.
// - 풀이는 초등학생 눈높이로 쓰고, 역사적 사실과 맞아야 한다.

export type GlossaryEntry = {
  /** 글에 나오는 모양 그대로의 낱말 */
  word: string
  /** 한자 (없으면 생략) */
  hanja?: string
  /** 풀이 */
  meaning: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { word: '정전', hanja: '正殿', meaning: '궁궐에서 나라의 큰 행사를 치르던 가장 중요한 건물' },
  { word: '장인', hanja: '匠人', meaning: '손재주가 뛰어나 물건을 만드는 기술자' },
  { word: '총통', hanja: '銃筒', meaning: '화약으로 탄환을 쏘던 옛날 대포 같은 무기' },
  { word: '사신', hanja: '使臣', meaning: '나라를 대표해 다른 나라에 보낸 신하' },
  { word: '조회', hanja: '朝會', meaning: '신하들이 모여 왕에게 인사드리던 모임' },
  { word: '의식', hanja: '儀式', meaning: '정해진 방법에 따라 치르는 중요한 행사' },
  { word: '시위', hanja: '示威', meaning: '많은 사람이 모여 자기들의 뜻을 크게 외치는 일' },
  { word: '도읍', hanja: '都邑', meaning: '나라의 수도' },
  { word: '법궁', hanja: '法宮', meaning: '왕이 머물며 나랏일을 보던 으뜸 궁궐' },
  { word: '중건', hanja: '重建', meaning: '무너지거나 불탄 건물을 다시 지음' },
  { word: '누각', hanja: '樓閣', meaning: '사방을 볼 수 있게 높이 지은 집' },
  { word: '헌병', hanja: '憲兵', meaning: '군대에서 경찰 일을 하던 군인' },
  { word: '녹로', hanja: '轆轤', meaning: '도르래로 무거운 물건을 들어 올리던 기구' },
  { word: '품삯', meaning: '일을 한 대가로 받는 돈' },
  { word: '화산', hanja: '花山', meaning: '수원에 있던 산 이름, 꽃뫼' },
]
