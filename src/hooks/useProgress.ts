import { useEffect, useState } from 'react'
import { defaultLook, migrateEquipped } from '../data/avatar'
import { DEMO_VISITED_IDS } from '../data/places'
import type { AvatarLook, Difficulty, Equipped, LearningRecord } from '../types'

// 사용자 진행 상황 (학습 기록, 아바타, 설정)
// '먼저 둘러보기' 사용자를 위해 브라우저(localStorage)에 저장한다.
// 둘러보다가 로그인하면 같은 기록을 그대로 계정 기록으로 이어간다.
// TODO: 실제 서비스에서는 로그인 시 서버(계정)에 저장

export type Progress = {
  loggedIn: boolean
  /** 이 기기에서 회원가입(이메일 또는 간편 로그인)을 마쳤는지. 간편 로그인 첫 이용 판단에 쓴다 */
  joined: boolean
  onboarded: boolean
  nickname: string
  look: AvatarLook
  /** 등록한 얼굴 사진 (작게 줄인 data URL) */
  faceImage?: string
  equipped: Equipped
  records: LearningRecord[]
  /** 직접 가서 열린 장소 id (위치는 저장하지 않고, 방문한 장소만 기억한다) */
  visitedIds: string[]
  defaultDifficulty: Difficulty
  pushEnabled: boolean
  /** 위치 설명 화면에서 고른 것 (on: 위치 켜기, later: 나중에). 위치 자체는 저장하지 않는다 */
  locationChoice?: 'on' | 'later'
  /** '이메일 기억하기'를 켰을 때 저장한 이메일 */
  rememberedEmail?: string
  /** 관심 장소로 표시한 장소 id */
  favorites: string[]
  battle: BattleRecord
  /** 내 문의 내역 (최신이 앞) */
  inquiries: Inquiry[]
}

export type InquiryKind = '사용 방법' | '오류 신고' | '학습 내용' | '기타'
/** 문의 한 건 (지금은 기기에만 저장. 실제 서비스에서는 서버에 저장하고 운영팀이 답변한다) */
export type Inquiry = {
  id: string
  kind: InquiryKind
  title: string
  body: string
  createdAt: string
  answer?: { body: string; at: string }
}

/** 대결 결과 한 건 */
export type BattleResult = { opponent: string; won: boolean; at: string }
/** 대결 기록: 전체 판수·승리 수 + 최근 결과 (최신이 앞) */
export type BattleRecord = { played: number; wins: number; recent: BattleResult[] }

/** 최근 대결 결과를 몇 개까지 보관할지 */
const RECENT_BATTLES = 20

const STORAGE_KEY = 'history-step-progress-v3'

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

/** 처음 실행 시 시연용 기록: 경복궁·수원화성 학습 완료(경복궁은 퀴즈도 완료), 불국사는 열리기만 함 */
function demoProgress(): Progress {
  return {
    loggedIn: false,
    joined: false,
    onboarded: false,
    nickname: '작은 탐험가',
    look: defaultLook,
    equipped: { 장비: 'gat', 의복: 'official-robe' },
    records: [
      { placeId: 'gyeongbokgung', learnedAt: daysAgo(9), quizAt: daysAgo(9) },
      { placeId: 'suwon', learnedAt: daysAgo(3) },
    ],
    visitedIds: DEMO_VISITED_IDS,
    defaultDifficulty: '보통',
    pushEnabled: true,
    favorites: ['bulguksa'],
    battle: { played: 0, wins: 0, recent: [] },
    // 시연용: 운영팀 답변이 달린 문의 한 건 (답변 내용은 학습 글의 사실과 맞춘다)
    inquiries: [
      {
        id: 'sample-answered',
        kind: '학습 내용',
        title: '수원화성은 누가 설계했나요?',
        body: '수원화성을 정약용이 설계했다고 들었는데 맞나요?',
        createdAt: daysAgo(5),
        answer: {
          body: '안녕하세요, 역사 한걸음 운영팀이에요. 정약용은 수원화성의 설계에 참여했고, 무거운 돌을 적은 힘으로 들어 올리는 거중기도 고안했어요. 수원화성 학습의 ‘보통’ 단계에서 더 자세히 읽어 볼 수 있어요. 좋은 질문 고마워요!',
          at: daysAgo(4),
        },
      },
    ],
  }
}

function load(): Progress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const demo = demoProgress()
      // 예전 기록의 틀린 문제 목록(없어진 복습 퀴즈용)은 버린다
      const { wrongAnswers: _removed, ...parsed } = JSON.parse(saved)
      // 예전에 저장한 기록에는 최근 대결 목록이 없을 수 있어 기본값과 합친다
      // 없어진 아이템(군모, 만세 태극기)을 착용하던 기록은 새 아이템으로 바꾼다
      const equipped = migrateEquipped(parsed.equipped ?? demo.equipped)
      // 방문 기록이 없던 예전 기록은 처음 상태의 방문 장소로 시작하고, 학습한 장소는 방문한 것으로 본다
      const records: LearningRecord[] = parsed.records ?? demo.records
      const visitedIds = [
        ...new Set([...(parsed.visitedIds ?? demo.visitedIds), ...records.map((record) => record.placeId)]),
      ]
      return { ...demo, ...parsed, equipped, visitedIds, battle: { ...demo.battle, ...parsed.battle } }
    }
  } catch {
    // 저장소를 쓸 수 없는 환경이면 기본값 사용
  }
  return demoProgress()
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // 사진 용량 등으로 저장 실패 시 무시
    }
  }, [progress])

  const update = (patch: Partial<Progress>) => setProgress((prev) => ({ ...prev, ...patch }))

  function upsertRecord(placeId: string, patch: Partial<LearningRecord>) {
    setProgress((prev) => {
      const existing = prev.records.find((record) => record.placeId === placeId)
      const records = existing
        ? prev.records.map((record) =>
            record.placeId === placeId ? { ...record, ...patch, learnedAt: record.learnedAt } : record,
          )
        : [...prev.records, { placeId, learnedAt: new Date().toISOString(), ...patch }]
      return { ...prev, records }
    })
  }

  const completedIds = progress.records.map((record) => record.placeId)
  const quizDoneIds = progress.records.filter((record) => record.quizAt).map((record) => record.placeId)

  return {
    progress,
    completedIds,
    quizDoneIds,
    update,
    /** 학습 완료: 기록 추가 (event 장소는 학습할 때 있던 시·도를 함께 저장) */
    completeLearning: (placeId: string, region?: string) => upsertRecord(placeId, region ? { region } : {}),
    completeQuiz: (placeId: string, region?: string) =>
      upsertRecord(placeId, { ...(region ? { region } : {}), quizAt: new Date().toISOString() }),
    /** 장소 반경 안에 들어왔을 때: 방문한 장소로 기억한다 (위치는 저장하지 않는다) */
    visitPlace: (placeId: string) =>
      setProgress((prev) =>
        prev.visitedIds.includes(placeId) ? prev : { ...prev, visitedIds: [...prev.visitedIds, placeId] },
      ),
    equip: (category: keyof Equipped, itemId?: string) =>
      setProgress((prev) => ({ ...prev, equipped: { ...prev.equipped, [category]: itemId } })),
    toggleFavorite: (placeId: string) =>
      setProgress((prev) => ({
        ...prev,
        favorites: prev.favorites.includes(placeId)
          ? prev.favorites.filter((id) => id !== placeId)
          : [...prev.favorites, placeId],
      })),
    /** 대결이 끝나면 결과를 기록한다 */
    recordBattle: (opponent: string, won: boolean) =>
      setProgress((prev) => ({
        ...prev,
        battle: {
          played: prev.battle.played + 1,
          wins: prev.battle.wins + (won ? 1 : 0),
          recent: [{ opponent, won, at: new Date().toISOString() }, ...prev.battle.recent].slice(
            0,
            RECENT_BATTLES,
          ),
        },
      })),
    /** 문의 보내기: 내 문의 내역 맨 앞에 '답변 대기 중'으로 쌓는다 */
    addInquiry: (inquiry: Pick<Inquiry, 'kind' | 'title' | 'body'>) =>
      setProgress((prev) => ({
        ...prev,
        inquiries: [
          { ...inquiry, id: `${Date.now()}`, createdAt: new Date().toISOString() },
          ...prev.inquiries,
        ],
      })),
    resetProgress: () => setProgress(demoProgress()),
  }
}
