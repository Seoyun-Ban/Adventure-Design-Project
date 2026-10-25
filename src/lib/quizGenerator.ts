import { getContent } from '../data/contents'
import { facts, type Fact } from '../data/facts'
import { josa } from './korean'
import type { Difficulty, QuizItem } from '../types'

// 퀴즈 만들기
// 1) 배포 서버에 AI(Claude API)가 연결돼 있으면 학습 글을 바탕으로 AI가 새 문제를 만든다. (/api/quiz)
// 2) 연결이 안 돼 있거나 실패하면 기기 안에서 자동 생성한다.
//    준비된 문제 + 사실 묶음(facts.ts)으로 만든 객관식·O/X 문제 중에서 매번 무작위로 뽑는다.

export type GeneratedQuiz = QuizItem & { placeId: string; level: Difficulty; source: 'ai' | 'local' }

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

function fromFact(fact: Fact): QuizItem[] {
  const wrong = shuffle(fact.wrong)
  const mcq: QuizItem = {
    question: fact.ask,
    options: [fact.answer, ...wrong.slice(0, 3)],
    answer: 0,
    note: fill(fact.statement, fact.answer),
  }
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
  const generated = (facts[placeId] ?? []).filter((fact) => fact.levels.includes(level)).flatMap(fromFact)
  return [...prepared, ...generated]
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
  return pick(questionPool(placeId, level), count, avoid).map((item) => ({
    ...item,
    placeId,
    level,
    source: 'local',
  }))
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
    if (valid.length < count) throw new Error('not enough questions')
    return valid
      .slice(0, count)
      .map((item) => ({ ...shuffleOptions(item), note: item.note ?? '', placeId, level, source: 'ai' }))
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
