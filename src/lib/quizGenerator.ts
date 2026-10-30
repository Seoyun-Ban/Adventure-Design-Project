import { getContent } from '../data/contents'
import { facts, type Fact } from '../data/facts'
import { DEEP_QUESTIONS } from '../data/quizBank'
import { josa } from './korean'
import type { Difficulty, QuizItem } from '../types'

// 퀴즈 만들기
// 1) 배포 서버에 AI(Claude API)가 연결돼 있으면 학습 글을 바탕으로 AI가 새 문제를 만든다. (/api/quiz)
// 2) 연결이 안 돼 있거나 실패하면 기기 안에서 자동 생성한다.
//    준비된 문제 + 사실 묶음(facts.ts)으로 만든 객관식·O/X 문제 중에서 매번 무작위로 뽑는다.
// 단계별 차이
// - 쉬움: O/X와 보기 3개 문제. 틀리면 힌트 한 줄(학습 글의 '기억해 볼까요?')을 보고 한 번 더 고를 수 있다
// - 보통: 보기 4개
// - 어려움: 보기 4개, 연도·인물 연결이나 이유를 묻는 문제(quizBank의 DEEP_QUESTIONS)를 먼저 낸다

export type GeneratedQuiz = QuizItem & {
  placeId: string
  level: Difficulty
  source: 'ai' | 'local'
  /** 쉬움 단계에서 틀렸을 때 보여주는 힌트 한 줄 */
  hint?: string
}

/** 쉬움 단계 보기 수 (O/X는 2개) */
const EASY_OPTIONS = 3

const shuffle = <T>(list: T[]) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function fill(statement: string, word: string) {
  return statement
    .replace('{answer}', word)
    .replace('{이}', josa(word, '이'))
    .replace('{을}', josa(word, '을'))
    .replace('{과}', josa(word, '과'))
    .replace('{으로}', josa(word, '으로'))
}

/** 보기를 섞고 정답 위치를 다시 계산 */
export function shuffleOptions<T extends QuizItem>(item: T): T {
  if (item.options.join() === 'O,X') return item // O/X는 순서 고정
  const order = shuffle(item.options.map((_, index) => index))
  return { ...item, options: order.map((index) => item.options[index]), answer: order.indexOf(item.answer) }
}

/** 보기를 정답 + 오답 몇 개로 줄인다 (쉬움 단계: 3개) */
function withOptionCount<T extends QuizItem>(item: T, count: number): T {
  if (item.options.length <= count) return item
  const wrong = shuffle(item.options.filter((_, index) => index !== item.answer)).slice(0, count - 1)
  return { ...item, options: [item.options[item.answer], ...wrong], answer: 0 }
}

const isOX = (item: QuizItem) => item.options.length === 2

/** 사실 하나로 문제 만들기. O/X는 쉬움 단계에서만 낸다 */
function fromFact(fact: Fact, level: Difficulty): QuizItem[] {
  const wrong = shuffle(fact.wrong)
  const mcq: QuizItem = {
    question: fact.ask,
    options: [fact.answer, ...wrong.slice(0, level === '쉬움' ? EASY_OPTIONS - 1 : 3)],
    answer: 0,
    note: fill(fact.statement, fact.answer),
  }
  if (level !== '쉬움') return [mcq]
  const isTrue = Math.random() < 0.5
  const shown = isTrue ? fact.answer : wrong[0]
  const ox: QuizItem = {
    question: `O/X: ${fill(fact.statement, shown)}`,
    options: ['O', 'X'],
    answer: isTrue ? 0 : 1,
    note: isTrue ? '맞아요, 옳은 문장이에요.' : `틀린 문장이에요. ${fill(fact.statement, fact.answer)}`,
  }
  return [mcq, ox]
}

/** 장소·난이도에 맞는 문제 후보 전체 */
export function questionPool(placeId: string, level: Difficulty): QuizItem[] {
  const prepared = getContent(placeId).quiz[level]
  const generated = (facts[placeId] ?? [])
    .filter((fact) => fact.levels.includes(level))
    .flatMap((fact) => fromFact(fact, level))
  if (level === '쉬움') return [...prepared.map((item) => withOptionCount(item, EASY_OPTIONS)), ...generated]
  // 보통·어려움은 보기 4개 문제만 (O/X 제외)
  const fourWay = [...prepared, ...generated].filter((item) => !isOX(item))
  return level === '어려움' ? [...(DEEP_QUESTIONS[placeId] ?? []), ...fourWay] : fourWay
}

/** 같은 내용을 묻는 문제가 겹치지 않게 count개 뽑기 */
function pick(pool: QuizItem[], count: number, avoid: string[] = []) {
  const seenAnswers = new Set<string>()
  const result: QuizItem[] = []
  const fresh = shuffle(pool.filter((item) => !avoid.includes(item.question)))
  const rest = shuffle(pool.filter((item) => avoid.includes(item.question)))
  for (const item of [...fresh, ...rest]) {
    const key = item.options[item.answer] + (item.options.length === 2 ? item.question.slice(5, 14) : '')
    if (seenAnswers.has(key)) continue
    seenAnswers.add(key)
    result.push(shuffleOptions(item))
    if (result.length === count) break
  }
  return result
}

export function generateLocal(
  placeId: string,
  level: Difficulty,
  count = 3,
  avoid: string[] = [],
): GeneratedQuiz[] {
  const pool = questionPool(placeId, level)
  let chosen: QuizItem[]
  if (level === '어려움') {
    // 연결·이유 문제를 먼저 (최대 count-1개), 나머지는 다른 어려움 문제
    const deep = pick(
      pool.filter((item) => item.kind),
      Math.min(2, count - 1),
      avoid,
    )
    const rest = pick(
      pool.filter((item) => !item.kind),
      count - deep.length,
      [...avoid, ...deep.map((item) => item.question)],
    )
    chosen = shuffle([...deep, ...rest])
  } else if (level === '쉬움') {
    // O/X 한 문제는 꼭 넣고, 나머지는 O/X와 보기 3개 문제에서
    const ox = pick(pool.filter(isOX), 1, avoid)
    const rest = pick(pool, count - ox.length, [...avoid, ...ox.map((item) => item.question)])
    chosen = shuffle([...ox, ...rest])
  } else {
    chosen = pick(pool, count, avoid)
  }
  const hint = level === '쉬움' ? getContent(placeId).remember : undefined
  return chosen.map((item) => ({ ...item, placeId, level, source: 'local', hint }))
}

/** AI로 만들어 보고, 안 되면 기기 안에서 생성 */
export async function generateQuiz(
  placeId: string,
  level: Difficulty,
  count = 3,
  avoid: string[] = [],
): Promise<GeneratedQuiz[]> {
  try {
    const content = getContent(placeId)
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 9000)
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        level,
        count,
        avoid,
        text: [
          content.headline,
          content.body[level].intro,
          content.body[level].detail,
          content.didYouKnow,
        ].join('\n'),
      }),
    })
    window.clearTimeout(timer)
    if (!response.ok) throw new Error(String(response.status))
    const data = (await response.json()) as { questions?: QuizItem[] }
    const valid = (data.questions ?? []).filter(
      (item) =>
        typeof item.question === 'string' &&
        Array.isArray(item.options) &&
        item.options.length >= 2 &&
        Number.isInteger(item.answer) &&
        item.answer >= 0 &&
        item.answer < item.options.length,
    )
    // 단계에 맞는 보기 수로 맞춘다 (쉬움: 3개 이하, 보통·어려움: 4개)
    const fitted =
      level === '쉬움'
        ? valid.map((item) => withOptionCount(item, EASY_OPTIONS))
        : valid.filter((item) => item.options.length >= 4)
    if (fitted.length < count) throw new Error('not enough questions')
    const hint = level === '쉬움' ? content.remember : undefined
    return fitted
      .slice(0, count)
      .map((item) => ({ ...shuffleOptions(item), note: item.note ?? '', placeId, level, source: 'ai', hint }))
  } catch {
    return generateLocal(placeId, level, count, avoid)
  }
}

/** 친구 대결용: 모든 장소·난이도에서 완전 무작위 한 문제 */
export function randomBattleQuestion(previous?: string): QuizItem {
  const placeIds = Object.keys(facts)
  const levels: Difficulty[] = ['쉬움', '보통', '어려움']
  for (let tries = 0; tries < 10; tries += 1) {
    const placeId = placeIds[Math.floor(Math.random() * placeIds.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const pool = questionPool(placeId, level)
    const item = pool[Math.floor(Math.random() * pool.length)]
    if (item && item.question !== previous) return shuffleOptions(item)
  }
  return shuffleOptions(questionPool('gyeongbokgung', '쉬움')[0])
}

/** 보스전용: 모든 장소의 문제를 난이도별로 한 번만 모은 묶음 (같은 판에서 문제가 겹치지 않게 질문 글로 중복을 없앤다) */
export function bossQuestionPools(): Record<Difficulty, QuizItem[]> {
  const placeIds = Object.keys(facts)
  const pools = {} as Record<Difficulty, QuizItem[]>
  for (const level of ['쉬움', '보통', '어려움'] as Difficulty[]) {
    const seen = new Set<string>()
    pools[level] = placeIds
      .flatMap((placeId) => questionPool(placeId, level))
      .filter((item) => !seen.has(item.question) && !!seen.add(item.question))
  }
  return pools
}
