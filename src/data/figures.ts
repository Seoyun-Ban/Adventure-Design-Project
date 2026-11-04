import type { AvatarLook, Equipped } from '../types'
import type { VoiceSpec } from '../lib/speech'

// 학습 화면 2D 장면에 등장하는 역사 인물과 대사
// - speaker: 'figure'(역사 인물) / 'me'(사용자 아바타)
// - voice: 기기 목소리 중 남성/여성을 골라 읽고, 높낮이·빠르기는 나이·성격에 맞게 살짝만 바꾼다.
//   녹음 파일 public/audio/장소id/줄번호.mp3 (내 캐릭터는 줄번호-boy/-girl.mp3)가 있으면 녹음만 재생한다.
//   녹음 파일은 이 규칙으로 넣으면 재생된다 (줄번호는 아래 대사 순서, 1부터).
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
    dialogue: [
      { speaker: 'figure', text: '어서 오너라! 나는 조선을 세운 태조 이성계란다.' },
      {
        speaker: 'figure',
        text: "한양으로 도읍을 옮기고 1395년, 백악산 아래에 이 궁궐을 지었지. 정도전이 '큰 복'을 누리라는 뜻으로 경복궁이라 이름 지었단다.",
      },
      { speaker: 'me', text: '와, 저기 제일 큰 건물은 뭐예요?' },
      {
        speaker: 'figure',
        text: '근정전이란다. 왕이 자리에 오르는 즉위식처럼 나라의 큰 의식을 치르는 곳이지.',
      },
      { speaker: 'me', text: '경복궁은 임진왜란 때 불탔지만, 1867년에 다시 지어졌대요!' },
      { speaker: 'figure', text: '그렇구나. 다시 세워져 이렇게 너를 만나니 참 반갑구나.' },
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
    dialogue: [
      { speaker: 'figure', text: '반갑구나. 나는 조선의 임금 정조란다.' },
      {
        speaker: 'figure',
        text: '아버지 사도세자의 무덤을 이곳 수원으로 옮기고, 새 고을을 지키는 성을 쌓았지.',
      },
      { speaker: 'me', text: '이렇게 큰 돌을 어떻게 다 옮겼어요?' },
      {
        speaker: 'figure',
        text: '정약용이 제안한 거중기 덕분이란다. 적은 힘으로 무거운 돌을 들어 올릴 수 있었지.',
      },
      {
        speaker: 'me',
        text: '성이 무너졌을 때도 『화성성역의궤』 기록 덕분에 옛 모습대로 다시 고칠 수 있었대요!',
      },
      { speaker: 'figure', text: '그렇구나. 꼼꼼히 기록해 두길 참 잘했구나.' },
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
    dialogue: [
      { speaker: 'figure', text: '반갑소. 나는 대한민국 임시정부에서 독립운동을 한 김구요.' },
      {
        speaker: 'me',
        text: '여기는 독립기념관이에요. 나라를 되찾으려 애쓴 분들을 기억하려고 국민들이 성금을 모아 지었대요.',
      },
      { speaker: 'figure', text: '그렇구려. 국민들이 마음을 모아 세운 곳이라니 참 고맙소.' },
      { speaker: 'me', text: '원래는 1986년에 문을 열려다 불이 나서, 1987년 광복절에 문을 열었대요.' },
      { speaker: 'figure', text: '어려움을 이겨 내고 세웠구려. 오래도록 우리 역사를 지켜 주시오.' },
    ],
  },
  aunae: {
    name: '유관순',
    title: '아우내 장터 만세 운동을 이끈 이화학당 학생',
    image: '/images/characters/yugwansun.png',
    look: { gender: '여', body: '마름', hair: '긴 머리', skin: '#f2c9a0' },
    equipped: { 무기: 'declaration' },
    voice: { gender: 'female', pitch: 1.05, rate: 1.0 },
    dialogue: [
      { speaker: 'figure', text: '반가워! 나는 이곳 천안 병천이 고향인 유관순이야.' },
      {
        speaker: 'figure',
        text: '1919년 4월 1일 장날, 이 장터에 수천 명이 모여 함께 대한 독립 만세를 외쳤어.',
      },
      { speaker: 'me', text: '그날을 위해 미리 준비했다면서요?' },
      {
        speaker: 'figure',
        text: '응. 서울에서 숨겨 온 독립선언서를 마을 어른들께 보여 드리고, 사촌 언니와 태극기를 만들었지.',
      },
      { speaker: 'me', text: '그렇게 용감하게 나설 수 있었던 건 왜예요?' },
      { speaker: 'figure', text: '우리 모두의 나라를 되찾고 싶었으니까. 그 마음은 누구에게나 있단다.' },
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
    dialogue: [
      { speaker: 'figure', text: '어서 오시오. 나는 신라의 김대성이오. 751년부터 이 절을 짓기 시작했다오.' },
      { speaker: 'figure', text: '부처님의 나라를 이 땅 위에 나타내고 싶었지. 그래서 이름도 불국사라오.' },
      { speaker: 'me', text: '두 탑의 모양이 완전히 달라요!' },
      { speaker: 'figure', text: '화려한 다보탑과 단정한 석가탑이오. 서로 다른 아름다움을 비교해 보시오.' },
      { speaker: 'me', text: '1995년에는 석굴암과 함께 세계유산이 되었대요!' },
      { speaker: 'figure', text: '정성 들여 지은 절을 온 세상이 알아준다니 참으로 기쁘구려.' },
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
    dialogue: [
      { speaker: 'figure', text: '나는 조선 수군을 이끈 이순신이다.' },
      { speaker: 'figure', text: '1592년 여름, 적의 배들이 좁은 바다 견내량에 모여 있다는 소식을 들었지.' },
      { speaker: 'me', text: '그럼 바로 그곳으로 쳐들어갔어요?' },
      {
        speaker: 'figure',
        text: '아니다. 좁은 곳에서 싸우면 불리했지. 그래서 적을 넓은 한산도 앞바다로 끌어냈단다.',
      },
      {
        speaker: 'figure',
        text: '그리고 학이 날개를 펼치듯 배를 둘러 세워 크게 무찔렀다. 이것이 학익진이다!',
      },
      { speaker: 'me', text: '이 승리는 지금도 한산도 대첩이라는 이름으로 기억되고 있어요!' },
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
    dialogue: [
      { speaker: 'figure', text: '어서 오너라. 나는 조선의 임금 세종이다.' },
      {
        speaker: 'figure',
        text: '우리말과 한자가 달라, 백성들이 자기 뜻을 글로 나타내기 어려운 것이 안타까웠단다.',
      },
      { speaker: 'me', text: '그래서 새 글자를 만드신 거예요?' },
      {
        speaker: 'figure',
        text: '그렇지. 1443년 스물여덟 자를 만들고, 1446년 그 원리를 담은 책을 펴냈단다.',
      },
      {
        speaker: 'me',
        text: '지금 우리가 쓰는 한글이 바로 그 글자예요. 10월 9일은 한글날로 기념하고 있어요!',
      },
      { speaker: 'figure', text: '오늘날 모두가 그 글자를 쓴다니, 이보다 기쁜 일이 없구나.' },
    ],
  },
}

/** 내 캐릭터 목소리: 남자아이는 남성 목소리, 여자아이는 여성 목소리를 조금 높게 */
export function myVoiceFor(gender: AvatarLook['gender']): VoiceSpec {
  return gender === '남'
    ? { gender: 'male', pitch: 1.12, rate: 1.02 }
    : { gender: 'female', pitch: 1.1, rate: 1.02 }
}
