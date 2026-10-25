import type { Difficulty } from '../types'

// 퀴즈 자동 생성용 사실 묶음
// 학습 글에 나온 사실 하나로 객관식(오답 보기는 wrong에서 무작위)과 O/X 문제를 만든다.
// - levels: 이 사실로 문제를 낼 학습 단계
// - statement: O/X 문제용 문장. {answer} 자리에 정답 또는 오답이 들어가고,
//   {이} {을} {으로} {과}는 앞 낱말 받침에 맞게 이/가, 을/를, 으로/로, 과/와로 바뀐다.

export type Fact = {
  levels: Difficulty[]
  ask: string
  answer: string
  wrong: string[]
  statement: string
}

export const facts: Record<string, Fact[]> = {
  gyeongbokgung: [
    {
      levels: ['쉬움', '보통'],
      ask: '경복궁을 처음 세운 나라는?',
      answer: '조선',
      wrong: ['고려', '신라', '백제', '고구려'],
      statement: '경복궁은 {answer} 시대에 처음 세워졌다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '경복궁이 처음 완성된 해는?',
      answer: '1395년',
      wrong: ['1392년', '1446년', '1592년', '1867년'],
      statement: '경복궁은 {answer}에 처음 완성되었다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '경복궁에서 왕이 큰 의식을 치르던 건물은?',
      answer: '근정전',
      wrong: ['경회루', '향원정', '광화문', '교태전'],
      statement: '왕이 큰 의식을 치르던 경복궁의 중심 건물은 {answer}이다.',
    },
    {
      levels: ['어려움'],
      ask: '경복궁을 다시 지은(중건) 해는?',
      answer: '1867년',
      wrong: ['1395년', '1592년', '1776년', '1910년'],
      statement: '흥선대원군의 주도로 경복궁은 {answer}에 중건되었다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '경복궁 전각에 이름을 붙인 인물은?',
      answer: '정도전',
      wrong: ['정몽주', '이황', '정약용', '김정호'],
      statement: '경복궁 전각의 이름은 {answer}{이} 지었다.',
    },
  ],
  suwon: [
    {
      levels: ['쉬움', '보통'],
      ask: '수원화성을 쌓게 한 임금은?',
      answer: '정조',
      wrong: ['세종', '태조', '영조', '고종'],
      statement: '수원화성은 {answer} 때 쌓았다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '수원화성 공사에 쓰인, 돌을 들어 올리는 기계는?',
      answer: '거중기',
      wrong: ['측우기', '자격루', '혼천의', '앙부일구'],
      statement: '수원화성 공사에는 {answer}{을} 이용해 무거운 돌을 들었다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '거중기를 고안한 학자는?',
      answer: '정약용',
      wrong: ['장영실', '김정호', '허준', '박지원'],
      statement: '거중기는 {answer}{이} 고안했다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '수원화성이 완성된 해는?',
      answer: '1796년',
      wrong: ['1776년', '1794년', '1801년', '1897년'],
      statement: '수원화성은 {answer}에 완성되었다.',
    },
    {
      levels: ['어려움'],
      ask: '수원화성 공사 기록을 담은 책은?',
      answer: '화성성역의궤',
      wrong: ['조선왕조실록', '동국여지승람', '목민심서', '경국대전'],
      statement: '수원화성 공사 과정은 『{answer}』에 기록되었다.',
    },
  ],
  independence: [
    {
      levels: ['쉬움', '보통'],
      ask: '독립기념관이 있는 도시는?',
      answer: '천안',
      wrong: ['공주', '청주', '대전', '아산'],
      statement: '독립기념관은 {answer}에 있다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '독립기념관이 문을 연 기념일은?',
      answer: '광복절',
      wrong: ['삼일절', '개천절', '한글날', '제헌절'],
      statement: '독립기념관은 {answer}에 문을 열었다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '독립기념관이 개관한 해는?',
      answer: '1987년',
      wrong: ['1977년', '1982년', '1995년', '2005년'],
      statement: '독립기념관은 {answer}에 개관했다.',
    },
    {
      levels: ['어려움'],
      ask: '독립기념관 중심 건물의 이름은?',
      answer: '겨레의 집',
      wrong: ['나라의 문', '광복의 탑', '자유의 집', '평화의 전당'],
      statement: '독립기념관의 중심 건물은 ‘{answer}’이다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '독립기념관 건립의 바탕이 된 것은?',
      answer: '국민 성금',
      wrong: ['외국 지원금', '복권 수익', '기업 한 곳의 기부', '왕실 재산'],
      statement: '독립기념관은 {answer}{을} 바탕으로 지어졌다.',
    },
  ],
  bulguksa: [
    {
      levels: ['쉬움', '보통'],
      ask: '불국사가 지어진 나라는?',
      answer: '신라',
      wrong: ['백제', '고구려', '고려', '가야'],
      statement: '불국사는 {answer} 때 지어졌다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '불국사가 있는 도시는?',
      answer: '경주',
      wrong: ['부여', '공주', '김해', '개성'],
      statement: '불국사는 {answer}에 있다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '불국사를 짓기 시작한 해는?',
      answer: '751년',
      wrong: ['676년', '935년', '1392년', '527년'],
      statement: '불국사는 {answer}에 짓기 시작했다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '불국사와 함께 세계유산이 된 곳은?',
      answer: '석굴암',
      wrong: ['첨성대', '황룡사지', '안압지', '분황사'],
      statement: '불국사는 {answer}{과} 함께 세계유산으로 등재되었다.',
    },
    {
      levels: ['어려움'],
      ask: '불국사 창건을 시작한 인물은?',
      answer: '김대성',
      wrong: ['김유신', '원효', '의상', '최치원'],
      statement: '불국사는 {answer}{이} 짓기 시작했다.',
    },
  ],
  hansando: [
    {
      levels: ['쉬움', '보통'],
      ask: '한산도 대첩을 이끈 장군은?',
      answer: '이순신',
      wrong: ['권율', '김시민', '강감찬', '을지문덕'],
      statement: '한산도 대첩은 {answer} 장군이 이끌었다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '한산도 대첩에서 쓴 진법은?',
      answer: '학익진',
      wrong: ['장사진', '어린진', '방원진', '일자진'],
      statement: '한산도 대첩에서는 {answer}{으로} 적을 둘러쌌다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '한산도 대첩이 일어난 해는?',
      answer: '1592년',
      wrong: ['1597년', '1598년', '1636년', '1510년'],
      statement: '한산도 대첩은 {answer}에 일어났다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '한산도 대첩이 일어난 전쟁은?',
      answer: '임진왜란',
      wrong: ['병자호란', '정묘호란', '6·25 전쟁', '귀주 대첩'],
      statement: '한산도 대첩은 {answer} 중에 일어났다.',
    },
    {
      levels: ['어려움'],
      ask: '이순신이 적을 유인해 낸 좁은 바다는?',
      answer: '견내량',
      wrong: ['명량', '노량', '울돌목', '당포'],
      statement: '이순신은 {answer}에 있던 적을 넓은 바다로 끌어냈다.',
    },
  ],
  hunminjeongeum: [
    {
      levels: ['쉬움', '보통'],
      ask: '훈민정음을 만든 임금은?',
      answer: '세종',
      wrong: ['태조', '정조', '영조', '성종'],
      statement: '훈민정음은 {answer}{이} 만들었다.',
    },
    {
      levels: ['쉬움', '보통'],
      ask: '처음 만든 훈민정음의 글자 수는?',
      answer: '28자',
      wrong: ['24자', '26자', '30자', '32자'],
      statement: '처음 만든 훈민정음은 {answer}였다.',
    },
    {
      levels: ['보통', '어려움'],
      ask: '훈민정음을 반포한 해는?',
      answer: '1446년',
      wrong: ['1392년', '1443년', '1450년', '1592년'],
      statement: '훈민정음은 {answer}에 반포되었다.',
    },
    {
      levels: ['어려움'],
      ask: '훈민정음을 창제한 해는?',
      answer: '1443년',
      wrong: ['1418년', '1446년', '1450년', '1395년'],
      statement: '훈민정음은 {answer}에 창제되었다.',
    },
    {
      levels: ['쉬움', '보통', '어려움'],
      ask: '훈민정음 반포를 기념하는 날은?',
      answer: '한글날',
      wrong: ['광복절', '개천절', '삼일절', '제헌절'],
      statement: '훈민정음 반포를 기념하는 날은 {answer}이다.',
    },
  ],
}
