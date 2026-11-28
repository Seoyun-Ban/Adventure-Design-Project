import { useEffect, useRef, useState } from 'react'
import { battleFriends, defaultLook, levelFor, migrateEquipped, xpForLevel } from '../data/avatar'
import { LEAGUE_START } from '../data/battle'
import { withFriendLevels } from '../lib/battleBalance'
import { addFriendResult, buildStandings, myRank, playFriendMatch, type Tally } from '../lib/league'
import { DEMO_VISITED_IDS, findPlace } from '../data/places'
import type { ArchiveEntry, AvatarLook, Difficulty, Equipped, LearningRecord, SocialProvider } from '../types'

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
  /** 학습 아카이브: 학습 완료·퀴즈 통과를 할 때마다 한 줄씩 (최신이 앞) */
  history: ArchiveEntry[]
  /** 직접 가서 열린 장소 id (위치는 저장하지 않고, 방문한 장소만 기억한다) */
  visitedIds: string[]
  /** 퀴즈로 모은 경험치. 레벨은 이 값으로 계산한다 (levelFor) */
  xp: number
  defaultDifficulty: Difficulty
  pushEnabled: boolean
  /** 위치 설명 화면에서 고른 것 (on: 위치 켜기, later: 나중에). 위치 자체는 저장하지 않는다 */
  locationChoice?: 'on' | 'later'
  /** 앱 소개 안내를 끝까지 봤거나 건너뛰었는지 (다시는 자동으로 띄우지 않는다) */
  tourDone?: boolean
  /**
   * 처음 시작 체험(튜토리얼)이 진행 중인 묶음 번호 (1~7). 없으면 하지 않거나 끝난 것.
   * 온보딩을 마칠 때 1로 시작하고, 끝나면 지운다. 앱을 닫았다 열면 이 묶음의 처음부터 이어간다.
   */
  tutorialStep?: number
  /** '이메일 기억하기'를 켰을 때 저장한 이메일 */
  rememberedEmail?: string
  /** 간편 로그인으로 들어왔으면 그 회사 (이메일 가입이면 없음) */
  loginProvider?: SocialProvider
  /** 이메일 가입 계정의 이메일 (계정 관리에 보여준다. 비밀번호는 저장하지 않는다) */
  accountEmail?: string
  /** 관심 장소로 표시한 장소 id */
  favorites: string[]
  battle: BattleRecord
  /** 대결 랭킹: 가상 친구들의 승패 기록 (친구 id → 기록). 내 기록은 battle에서 가져온다 */
  league: Record<string, Tally>
  /** 보스전(협동)에서 괴물을 물리친 횟수 */
  bossWins: number
  /** 보스전 기록 (팀 기록만. 개인별 기록은 남기지 않는다) */
  bossLog: BossLog
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

/** 보스전 한 판: 날짜, 함께한 사람 이름들, 이겼는지 */
export type BossResult = { at: string; names: string[]; won: boolean }
/** 보스전 기록: 전체 판수·승리 수 + 최근 결과 (최신이 앞) */
export type BossLog = { played: number; wins: number; recent: BossResult[] }

/** 학습 아카이브에 최대 몇 줄까지 보관할지 */
const MAX_HISTORY = 500

let entrySeq = 0
const newEntryId = () => `${Date.now().toString(36)}-${(entrySeq++).toString(36)}`

/** 장소별 기록(records)만 있던 예전 기록을 아카이브 줄로 바꾼다 (난이도·맞힌 수는 모르므로 비워 둔다) */
function historyFromRecords(records: LearningRecord[]): ArchiveEntry[] {
  const entries: ArchiveEntry[] = []
  for (const record of records) {
    entries.push({ id: newEntryId(), kind: 'learn', placeId: record.placeId, at: record.learnedAt })
    if (record.quizAt)
      entries.push({ id: newEntryId(), kind: 'quiz', placeId: record.placeId, at: record.quizAt })
  }
  return entries.sort((a, b) => b.at.localeCompare(a.at))
}

/** 최근 보스전 결과를 몇 개까지 보관할지 */
const RECENT_BOSS = 20

/** 최근 대결 결과를 몇 개까지 보관할지 */
const RECENT_BATTLES = 20

/** 지금 내 대결 랭킹 (1위부터) */
export function myLeagueRank(progress: Progress) {
  const me = { name: progress.nickname, level: levelFor(progress.xp), ...progress.battle }
  return myRank(buildStandings(me, withFriendLevels(battleFriends, me.level), progress.league))
}

/** 대결 결과를 반영한 새 기록: 내 기록·최근 결과, 가상 친구와 한 대결이면 그 친구의 기록도 함께 */
function withBattle(prev: Progress, opponent: string, won: boolean): Progress {
  const friend = battleFriends.find((candidate) => candidate.name === opponent)
  return {
    ...prev,
    battle: {
      played: prev.battle.played + 1,
      wins: prev.battle.wins + (won ? 1 : 0),
      recent: [{ opponent, won, at: new Date().toISOString() }, ...prev.battle.recent].slice(
        0,
        RECENT_BATTLES,
      ),
    },
    // 내 대결이 끝날 때마다 가상 친구들끼리도 한 판씩 겨룬 것으로 친다
    league: playFriendMatch(
      friend ? addFriendResult(prev.league, friend.id, won) : prev.league,
      withFriendLevels(battleFriends, levelFor(prev.xp)),
    ),
  }
}

const STORAGE_KEY = 'history-step-progress-v3'

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

/**
 * 처음 실행 시 시연용 기록: 수원화성만 학습 완료, 경복궁·불국사는 열리기만 함.
 * 아이템은 수원화성 것만 갖고 있고, 입고 있는 것은 없다 (착용은 사용자가 직접 한다)
 */
function demoProgress(): Progress {
  return {
    loggedIn: false,
    joined: false,
    onboarded: false,
    nickname: '작은 탐험가',
    look: defaultLook,
    equipped: {},
    records: [{ placeId: 'suwon', learnedAt: daysAgo(3) }],
    history: historyFromRecords([{ placeId: 'suwon', learnedAt: daysAgo(3) }]),
    visitedIds: DEMO_VISITED_IDS,
    // 처음 시작할 때 Lv.2 (1→2레벨에 필요한 100 XP를 채운 상태, 다음 레벨까지 120 XP)
    xp: xpForLevel(2),
    defaultDifficulty: '보통',
    pushEnabled: true,
    favorites: ['bulguksa'],
    battle: { played: 0, wins: 0, recent: [] },
    league: structuredClone(LEAGUE_START),
    bossWins: 0,
    bossLog: { played: 0, wins: 0, recent: [] },
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
      // 없어진 아이템(군모, 만세 태극기, 세종 붓)을 착용하던 기록은 새 아이템으로 바꾸거나 벗긴다
      const equipped = migrateEquipped(parsed.equipped ?? demo.equipped)
      // 방문 기록이 없던 예전 기록은 처음 상태의 방문 장소로 시작하고, 학습한 장소는 방문한 것으로 본다
      // 앱에서 없어진 장소(훈민정음 반포)의 학습 기록·방문 기록·관심 표시는 여기서 정리한다
      const records: LearningRecord[] = (parsed.records ?? demo.records)
        .filter((record: LearningRecord) => findPlace(record.placeId))
        .map(({ placeId, learnedAt, quizAt }: LearningRecord) => ({ placeId, learnedAt, quizAt }))
      // 아카이브 줄이 없던 예전 기록은 장소별 기록으로 최대한 채운다
      const history: ArchiveEntry[] = (parsed.history ?? historyFromRecords(records)).filter(
        (entry: ArchiveEntry) => findPlace(entry.placeId),
      )
      const visitedIds = [
        ...new Set([...(parsed.visitedIds ?? demo.visitedIds), ...records.map((record) => record.placeId)]),
      ].filter((id) => findPlace(id))
      const favorites: string[] = (parsed.favorites ?? demo.favorites).filter((id: string) => findPlace(id))
      // 경험치가 없던 예전 기록은 예전 레벨(1 + 학습한 장소 수)과 같아지도록 채운다
      const xp: number = typeof parsed.xp === 'number' ? parsed.xp : xpForLevel(1 + records.length)
      return {
        ...demo,
        ...parsed,
        equipped,
        records,
        history,
        visitedIds,
        favorites,
        xp,
        battle: { ...demo.battle, ...parsed.battle },
        league: { ...demo.league, ...parsed.league },
        bossLog: { ...demo.bossLog, ...parsed.bossLog },
      }
    }
  } catch {
    // 저장소를 쓸 수 없는 환경이면 기본값 사용
  }
  return demoProgress()
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)
  // 대결이 끝나는 순간(시간 예약 안)에도 최신 기록으로 계산하려고 ref에 같이 들고 있는다
  const latest = useRef(progress)
  latest.current = progress

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
    /** 학습 완료: 기록 추가 */
    completeLearning: (placeId: string) => upsertRecord(placeId, {}),
    /** 학습 아카이브에 한 줄 더하기 (학습을 마칠 때, 퀴즈를 통과할 때마다) */
    addHistory: (entry: Omit<ArchiveEntry, 'id' | 'at'>) =>
      setProgress((prev) => ({
        ...prev,
        history: [{ ...entry, id: newEntryId(), at: new Date().toISOString() }, ...prev.history].slice(
          0,
          MAX_HISTORY,
        ),
      })),
    completeQuiz: (placeId: string) => upsertRecord(placeId, { quizAt: new Date().toISOString() }),
    /** 퀴즈에서 얻은 경험치를 더한다 */
    addXp: (amount: number) => setProgress((prev) => ({ ...prev, xp: prev.xp + Math.max(0, amount) })),
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
    /**
     * 대결이 끝나면 결과를 기록한다 (친구 도전장 결과도 같은 길로 들어와 내 승패에 포함된다).
     * 순위가 어떻게 바뀌었는지(before → after)도 돌려준다.
     */
    recordBattle: (opponent: string, won: boolean) => {
      const prev = latest.current
      const next = withBattle(prev, opponent, won)
      latest.current = next
      setProgress(next)
      return { before: myLeagueRank(prev), after: myLeagueRank(next) }
    },
    /** 보스전이 끝나면: 날짜·함께한 이름·승패를 기록한다. 이겼으면 물리친 횟수를 올리고 경험치를 준다 */
    recordBossResult: (names: string[], won: boolean, xp: number) =>
      setProgress((prev) => ({
        ...prev,
        bossWins: prev.bossWins + (won ? 1 : 0),
        xp: prev.xp + (won ? Math.max(0, xp) : 0),
        bossLog: {
          played: prev.bossLog.played + 1,
          wins: prev.bossLog.wins + (won ? 1 : 0),
          recent: [{ at: new Date().toISOString(), names, won }, ...prev.bossLog.recent].slice(
            0,
            RECENT_BOSS,
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
    /** 처음부터 다시 시작하기: 처음 실행했을 때 상태로 (시연용 기록 포함) */
    resetProgress: () => setProgress(demoProgress()),
    /** 회원 탈퇴: 학습 기록·방문 기록·아바타·얼굴 사진·계정 정보를 모두 비운다 */
    clearAll: () =>
      setProgress({
        ...demoProgress(),
        equipped: {},
        records: [],
        history: [],
        visitedIds: [],
        xp: 0,
        favorites: [],
        inquiries: [],
      }),
  }
}
