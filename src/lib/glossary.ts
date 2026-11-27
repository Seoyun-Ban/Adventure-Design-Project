// 낱말 풀이: 글에서 낱말 풀이 목록(data/glossary.ts)의 낱말을 찾아 '밑줄 칠 곳'을 정한다.
// 화면 코드와 분리한 순수 함수라서 scripts/glossary.test.mjs가 그대로 검사한다.
import { GLOSSARY, type GlossaryEntry } from '../data/glossary.ts'

export type GlossarySegment = { text: string; entry?: GlossaryEntry }

const HANGUL = /[가-힣]/

/**
 * 낱말 바로 뒤에 올 수 있는 조사·말끝 (이 중 하나로 시작하거나, 낱말 뒤에 한글이 없으면 '낱말 그대로'로 본다)
 * 예: '정전이고'(O), '시위를'(O) / '시위대'(X), '의식주'(X), '장인어른'(X)
 */
const ENDINGS = [
  '으로',
  '에서',
  '에게',
  '까지',
  '부터',
  '처럼',
  '보다',
  '마다',
  '이고',
  '이며',
  '이라',
  '이다',
  '이에',
  '이었',
  '입니다',
  '이랍',
  '이야',
  '예요',
  '은',
  '는',
  '이',
  '가',
  '을',
  '를',
  '의',
  '에',
  '도',
  '만',
  '로',
  '와',
  '과',
  '란',
  '인',
  '였',
  '했',
  '라',
]

/**
 * 글 속에서 이 낱말이 '낱말 그대로' 쓰인 자리(시작 위치)를 모두 찾는다.
 * - 앞에 한글이 붙어 있으면 다른 낱말의 일부다 (근정전 안의 '정전', 활시위 안의 '시위', 무의식 안의 '의식')
 * - 뒤에 조사·말끝이 아닌 한글이 붙어 있어도 다른 낱말의 일부다 (시위대, 의식주, 장인어른)
 */
export function findWordMatches(text: string, word: string): number[] {
  const found: number[] = []
  let from = 0
  while (from <= text.length - word.length) {
    const at = text.indexOf(word, from)
    if (at < 0) break
    from = at + 1
    if (at > 0 && HANGUL.test(text[at - 1])) continue
    const tail = text.slice(at + word.length).match(/^[가-힣]*/)?.[0] ?? ''
    if (tail !== '' && !ENDINGS.some((ending) => tail.startsWith(ending))) continue
    found.push(at)
  }
  return found
}

/**
 * 여러 글을 화면에 나오는 순서대로 넣으면, 낱말마다 '처음 나오는 곳'에만 밑줄 표시를 붙여 준다.
 * (같은 낱말이 다시 나와도 밑줄은 한 번만. 글마다 쪼갠 조각 목록을 같은 순서로 돌려준다)
 * 퀴즈 문제처럼 글 하나씩 따로 쓰려면 글 하나만 넣는다.
 */
export function annotate(texts: string[], glossary: GlossaryEntry[] = GLOSSARY): GlossarySegment[][] {
  const used = new Set<string>()
  return texts.map((text) => {
    // 이 글에서 아직 안 쓴 낱말의 첫 자리
    const picks: { start: number; end: number; entry: GlossaryEntry }[] = []
    for (const entry of glossary) {
      if (used.has(entry.word)) continue
      const [start] = findWordMatches(text, entry.word)
      if (start !== undefined) picks.push({ start, end: start + entry.word.length, entry })
    }
    // 겹치는 자리는 앞선 것(같으면 더 긴 것)만 남긴다
    picks.sort((a, b) => a.start - b.start || b.end - a.end)
    const chosen: typeof picks = []
    for (const pick of picks) {
      if (chosen.length > 0 && pick.start < chosen[chosen.length - 1].end) continue
      chosen.push(pick)
      used.add(pick.entry.word)
    }
    const segments: GlossarySegment[] = []
    let cursor = 0
    for (const pick of chosen) {
      if (pick.start > cursor) segments.push({ text: text.slice(cursor, pick.start) })
      segments.push({ text: text.slice(pick.start, pick.end), entry: pick.entry })
      cursor = pick.end
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor) })
    return segments
  })
}

/** 풀이 창에 보여 줄 글: '낱말(한자) - 풀이' */
export function glossaryLine(entry: GlossaryEntry) {
  return `${entry.word}${entry.hanja ? `(${entry.hanja})` : ''} - ${entry.meaning}`
}
