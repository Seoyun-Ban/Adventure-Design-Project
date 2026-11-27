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
  { word: '광복', hanja: '光復', meaning: '빼앗겼던 나라를 되찾음' },
  { word: '성금', hanja: '誠金', meaning: '좋은 일에 쓰려고 정성껏 모아 내는 돈' },
  { word: '왜곡', hanja: '歪曲', meaning: '사실과 다르게 비뚤어지게 전함' },
  { word: '창건', hanja: '創建', meaning: '처음으로 세움' },
  { word: '대웅전', hanja: '大雄殿', meaning: '절에서 부처님을 모신 중심 건물' },
  { word: '국보', hanja: '國寶', meaning: '나라에서 특히 소중하게 지정한 문화유산' },
  { word: '세계유산', meaning: '유네스코가 온 인류가 함께 지켜야 한다고 정한 유산' },
  { word: '순국', hanja: '殉國', meaning: '나라를 위해 목숨을 바침' },
  { word: '휴교', hanja: '休校', meaning: '학교가 수업을 쉬고 문을 닫음' },
  { word: '옥중', hanja: '獄中', meaning: '감옥 안' },
  { word: '수군', hanja: '水軍', meaning: '바다에서 싸우는 군대' },
  { word: '학익진', hanja: '鶴翼陣', meaning: '학이 날개를 펼친 모양으로 배를 벌여 적을 둘러싸는 방법' },
  { word: '대첩', hanja: '大捷', meaning: '크게 이긴 싸움' },
  { word: '통제사', hanja: '統制使', meaning: '조선 수군을 이끌던 으뜸 장수' },
  { word: '의궤', hanja: '儀軌', meaning: '나라의 큰 행사나 공사를 그림과 글로 자세히 남긴 책' },
  { word: '거중기', hanja: '擧重機', meaning: '도르래를 이용해 무거운 돌을 들어 올리던 기구' },
  { word: '성곽', hanja: '城郭', meaning: '적을 막으려고 높이 쌓은 성의 벽' },
]
