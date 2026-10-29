import type { AvatarLook, Equipped } from '../types'
import type { VoiceSpec } from '../lib/speech'

// 학습 화면 2D 장면에 등장하는 역사 인물과 대사
// - speaker: 'figure'(역사 인물) / 'me'(사용자 아바타)
// - voice: 기기 목소리 중 남성/여성을 골라 읽고, 높낮이·빠르기는 나이·성격에 맞게 살짝만 바꾼다.
//   녹음 파일 public/audio/장소id/줄번호.mp3 가 있으면 그것을 먼저 재생한다 (docs/TEAM_GUIDE.md).
// - image: 캐릭터 그림 경로. 파일이 아직 없으면 look·equipped로 그린 SVG 캐릭터가 대신 나온다.
//   그림을 추가하는 법은 docs/TEAM_GUIDE.md 참고 (art/characters에 넣고 npm run images).
// 대사에는 인물이 살아 있던 때의 일만 직접 겪은 것처럼 말하게 한다.

export type DialogueLine = { speaker: 'figure' | 'me'; text: string }

export type HistoricalFigure = {
  name: string
  title: string
  image?: string
  look: AvatarLook
  equipped: Equipped
  beard?: 'mustache' | 'beard'
  /** 목소리: 남성/여성 + 나이·성격에 맞게 살짝 조절한 높낮이·빠르기 */
  voice: VoiceSpec
  /** 배경 음악 분위기 */
  mood: 'court' | 'temple' | 'sea' | 'memorial'
  dialogue: DialogueLine[]
}

const king: AvatarLook = { gender: '남', body: '튼튼', hair: '상투·쪽머리', skin: '#ecc19a' }

export const figures: Record<string, HistoricalFigure> = {
  gyeongbokgung: {
    name: '태조 이성계',
    title: '조선을 세운 임금',
    image: '/images/characters/taejo.png',
    look: king,
    equipped: { 장비: 'ikseongwan', 의복: 'royal-robe' },
    beard: 'beard',
    voice: { gender: 'male', pitch: 0.92, rate: 0.92 },
    mood: 'court',
    dialogue: [
      { speaker: 'figure', text: '어서 오너라! 나는 조선을 세운 태조 이성계란다.' },
      {
        speaker: 'figure',
        text: '1395년, 새 도읍 한양에 이 궁궐을 지었지. 정도전이 큰 복을 누리라는 뜻으로 경복궁이라 이름 붙였단다.',
      },
      { speaker: 'me', text: '와, 근정전이 정말 웅장해요!' },
      { speaker: 'figure', text: '그곳에서 나라의 큰 의식을 치렀단다. 천천히 둘러보거라.' },
    ],
  },
  suwon: {
    name: '정조',
    title: '조선의 스물두 번째 임금',
    image: '/images/characters/jeongjo.png',
    look: { ...king, body: '보통' },
    equipped: { 장비: 'ikseongwan', 의복: 'royal-robe', 무기: 'jeongjo-bow' },
    beard: 'mustache',
    voice: { gender: 'male', pitch: 0.98, rate: 0.96 },
    mood: 'court',
    dialogue: [
      { speaker: 'figure', text: '반갑구나. 나는 조선의 스물두 번째 임금, 정조다.' },
      { speaker: 'figure', text: '아버지 사도세자의 묘를 이곳 수원으로 옮기며, 새 도시와 성을 쌓았단다.' },
      { speaker: 'me', text: '이 큰 돌들을 어떻게 다 옮겼어요?' },
      {
        speaker: 'figure',
        text: '정약용이 만든 거중기 덕분이지! 무거운 돌도 적은 힘으로 들어 올릴 수 있었단다.',
      },
    ],
  },
  // 김구는 1949년에 세상을 떠났으므로, 1987년에 문을 연 기념관 이야기는 내 캐릭터가 전하고
  // 김구는 직접 본 것처럼 말하지 않는다.
  independence: {
    name: '김구',
    title: '대한민국 임시정부를 이끈 독립운동가',
    image: '/images/characters/kimgu.png',
    look: { gender: '남', body: '보통', hair: '짧은 머리', skin: '#e3b48c' },
    equipped: {},
    beard: 'mustache',
    voice: { gender: 'male', pitch: 0.9, rate: 0.88 },
    mood: 'memorial',
    dialogue: [
      { speaker: 'figure', text: '반갑소. 나는 중국에서 대한민국 임시정부를 이끌며 독립운동을 한 김구요.' },
      {
        speaker: 'me',
        text: '여기는 독립기념관이에요. 나라를 되찾으려 애쓴 분들을 기억하려고 국민들이 성금을 모아 지었대요.',
      },
      { speaker: 'figure', text: '그렇구려. 국민들이 마음을 모아 세운 곳이라니 참 고맙소.' },
      { speaker: 'me', text: '1987년 광복절에 문을 열었어요. 오래오래 기억할게요!' },
    ],
  },
  aunae: {
    name: '유관순',
    title: '아우내 장터 만세 운동을 이끈 이화학당 학생',
    image: '/images/characters/yugwansun.png',
    look: { gender: '여', body: '마름', hair: '긴 머리', skin: '#f2c9a0' },
    equipped: { 무기: 'declaration' },
    voice: { gender: 'female', pitch: 1.05, rate: 1.0 },
    mood: 'memorial',
    dialogue: [
      { speaker: 'figure', text: '반가워요. 나는 이화학당 학생 유관순이에요.' },
      {
        speaker: 'figure',
        text: '1919년 3월 1일, 서울에서 만세 운동에 함께했어요. 학교가 문을 닫자 독립선언서를 가지고 고향 병천으로 내려왔지요.',
      },
      { speaker: 'me', text: '그래서 이 장터에 사람들이 모인 거예요?' },
      {
        speaker: 'figure',
        text: '맞아요. 4월 1일 장날, 3천여 명이 모였어요. 나는 미리 준비한 태극기를 나누어 주고 맨 앞에서 대한 독립 만세를 외쳤답니다!',
      },
    ],
  },
  bulguksa: {
    name: '김대성',
    title: '불국사를 지은 신라의 재상',
    image: '/images/characters/kimdaeseong.png',
    look: { gender: '남', body: '보통', hair: '상투·쪽머리', skin: '#e8b890' },
    equipped: { 의복: 'silla-noble' },
    beard: 'mustache',
    voice: { gender: 'male', pitch: 0.96, rate: 0.92 },
    mood: 'temple',
    dialogue: [
      { speaker: 'figure', text: '나는 신라의 김대성이오. 751년부터 이 절을 짓기 시작했다오.' },
      { speaker: 'figure', text: '부처님의 나라를 이 땅 위에 만들고 싶었지.' },
      { speaker: 'me', text: '두 탑의 모양이 완전히 달라요!' },
      { speaker: 'figure', text: '화려한 다보탑과 단정한 석가탑, 서로 다른 아름다움을 비교해 보시오.' },
    ],
  },
  hansando: {
    name: '이순신',
    title: '조선 수군을 이끈 장군',
    image: '/images/characters/yisunsin.png',
    look: { gender: '남', body: '튼튼', hair: '상투·쪽머리', skin: '#dcaa80' },
    equipped: { 장비: 'helmet', 의복: 'armor', 무기: 'hwarang-sword' },
    beard: 'beard',
    voice: { gender: 'male', pitch: 0.9, rate: 0.94 },
    mood: 'sea',
    dialogue: [
      { speaker: 'figure', text: '나는 조선 수군을 이끈 이순신이다.' },
      { speaker: 'figure', text: '1592년 여름, 좁은 견내량에 있던 왜군을 넓은 바다로 끌어냈지.' },
      { speaker: 'me', text: '그다음엔 어떻게 됐어요?' },
      { speaker: 'figure', text: '학이 날개를 펼치듯 배를 둘러 세워 크게 무찔렀다. 이것이 한산도 대첩이다!' },
    ],
  },
  hunminjeongeum: {
    name: '세종',
    title: '훈민정음을 만든 임금',
    image: '/images/characters/sejong.png',
    look: king,
    equipped: { 장비: 'ikseongwan', 의복: 'royal-robe', 무기: 'brush' },
    beard: 'beard',
    voice: { gender: 'male', pitch: 0.95, rate: 0.92 },
    mood: 'court',
    dialogue: [
      { speaker: 'figure', text: '어서 오너라. 나는 조선의 네 번째 임금, 세종이다.' },
      { speaker: 'figure', text: '글을 몰라 억울한 일을 당하는 백성들을 보며 마음이 아팠단다.' },
      { speaker: 'me', text: '그래서 훈민정음을 만드신 거예요?' },
      {
        speaker: 'figure',
        text: '그렇지. 누구나 쉽게 익히도록 스물여덟 글자를 만들어 1446년에 널리 알렸단다.',
      },
    ],
  },
}

/** 내 캐릭터 목소리: 남자아이는 남성 목소리, 여자아이는 여성 목소리를 조금 높게 */
export function myVoiceFor(gender: AvatarLook['gender']): VoiceSpec {
  return gender === '남'
    ? { gender: 'male', pitch: 1.12, rate: 1.02 }
    : { gender: 'female', pitch: 1.1, rate: 1.02 }
}
