// 퀴즈 문제가 겹치거나 잘못 적히지 않았는지 검사한다 (실행: npm test)
// - 같은 문제가 두 번 나오지 않는다 (같은 장소의 난이도끼리도 포함)
// - 한 문제 안에 같은 보기가 없다
// - 정답 번호가 보기 안에 있다
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// contents.ts는 확장자 없는 import(./quizBank)를 써서 node가 바로 못 읽는다.
// 임시 폴더에 복사해 import 줄에만 .ts를 붙여 읽는다 (원본 파일은 건드리지 않는다).
const dir = await mkdtemp(join(tmpdir(), 'quiz-test-'))
await cp('src/data/quizBank.ts', join(dir, 'quizBank.ts'))
const contents = (await readFile('src/data/contents.ts', 'utf8')).replace(
  "from './quizBank'",
  "from './quizBank.ts'",
)
await writeFile(join(dir, 'contents.ts'), contents)
const load = (name) => import(pathToFileURL(join(dir, name)).href)

const { placeContents } = await load('contents.ts')
const { DEEP_QUESTIONS } = await load('quizBank.ts')

// 장소·난이도별 문제 목록 (어려움은 연결·이유 문제 포함)
const lists = []
for (const [placeId, content] of Object.entries(placeContents)) {
  for (const level of ['쉬움', '보통', '어려움']) {
    const items = [...content.quiz[level], ...(level === '어려움' ? (DEEP_QUESTIONS[placeId] ?? []) : [])]
    lists.push({ placeId, level, items })
  }
}

test('퀴즈: 같은 장소 안에서 같은 문제가 두 번 나오지 않는다', () => {
  for (const placeId of Object.keys(placeContents)) {
    const seen = new Map()
    for (const { level, items } of lists.filter((list) => list.placeId === placeId)) {
      for (const item of items) {
        const before = seen.get(item.question)
        assert.equal(before, undefined, `${placeId}: 같은 문제 "${item.question}" (${before}, ${level})`)
        seen.set(item.question, level)
      }
    }
  }
})

test('퀴즈: 한 문제 안에 같은 보기가 없다', () => {
  for (const { placeId, level, items } of lists) {
    for (const item of items) {
      assert.equal(
        new Set(item.options).size,
        item.options.length,
        `${placeId} ${level}: 같은 보기 "${item.question}"`,
      )
    }
  }
})

test('퀴즈: 정답 번호가 보기 안에 있다', () => {
  for (const { placeId, level, items } of lists) {
    for (const item of items) {
      assert.ok(
        Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length,
        `${placeId} ${level}: 정답 번호가 보기 밖 "${item.question}"`,
      )
    }
  }
})
