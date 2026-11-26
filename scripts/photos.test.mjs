// 학습 글 사진이 하나도 빠지지 않는지 검사한다 (실행: npm test)
// 1) sources.csv에 출처가 적힌 사진 수 = 앱 목록(photos.ts)의 사진 수, 줄인 사진 파일도 public에 있음
// 2) 장소별 사진 수 = 화면에 들어가는 사진 수 (문단 수가 몇 개든, 학습 단계가 어떻든)
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'
import { layoutPhotos } from '../src/lib/photoLayout.ts'
import { PLACE_PHOTOS } from '../src/data/generated/photos.ts'
import { placeIdOf, readPlaces, readSources } from './lib/photoSources.mjs'

const places = await readPlaces()
const sources = await readSources()
const LEVELS = ['쉬움', '보통', '어려움']

/** contents.ts에서 장소·학습 단계별 '자세히 읽기' 문단 수를 읽는다 → { 장소id: { 쉬움: 1, ... } } */
export async function detailParagraphCounts() {
  const text = await readFile('src/data/contents.ts', 'utf8')
  const result = {}
  for (const block of text.split(/^\s*placeId: '/m).slice(1)) {
    const id = block.slice(0, block.indexOf("'"))
    for (const level of LEVELS) {
      const start = block.search(new RegExp('^\\s{6}' + level + ': \\{', 'm'))
      if (start < 0) continue
      const match = block.slice(start).match(/detail:\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/s)
      if (!match) continue
      // 문자열 안의 줄바꿈 표시(역슬래시 n)로 문단을 센다
      ;(result[id] ??= {})[level] = match[2].split('\\n').length
    }
  }
  return result
}

test('sources.csv의 사진 수 = 앱에 들어간 사진 수', () => {
  const expected = {}
  for (const row of sources) {
    const id = placeIdOf(row.place, places)
    assert.ok(id, `장소를 못 찾음: ${row.place} (${row.file})`)
    if (row.credit) expected[id] = (expected[id] ?? 0) + 1
  }
  for (const id of Object.keys(places)) {
    const inApp = PLACE_PHOTOS[id]?.length ?? 0
    assert.equal(inApp, expected[id] ?? 0, `${id}: csv ${expected[id] ?? 0}장 ↔ 앱 ${inApp}장 (npm run images를 했는지 확인)`)
  }
})

test('앱 목록의 사진 파일이 public/images/photos에 모두 있다', async () => {
  for (const [id, list] of Object.entries(PLACE_PHOTOS)) {
    for (const photo of list) {
      assert.ok(await stat('public' + photo.src).catch(() => null), `${id}: 파일이 없음 ${photo.src}`)
      assert.ok(photo.credit, `${id}: 출처가 비어 있음 ${photo.src}`)
    }
  }
})

test('문단 수가 몇 개든 사진이 하나도 빠지거나 겹치지 않는다', () => {
  for (const [id, list] of Object.entries(PLACE_PHOTOS)) {
    for (let paragraphs = 0; paragraphs <= 8; paragraphs++) {
      const placed = layoutPhotos(list, paragraphs).flat()
      assert.equal(placed.length, list.length, `${id}, 문단 ${paragraphs}개: ${list.length}장 중 ${placed.length}장만 배치됨`)
      assert.equal(new Set(placed.map((p) => p.src)).size, list.length, `${id}, 문단 ${paragraphs}개: 같은 사진이 겹침`)
    }
  }
})

test('장소·학습 단계별로 화면에 들어가는 사진 수 = 장소의 사진 수', async () => {
  const counts = await detailParagraphCounts()
  assert.ok(
    Object.keys(counts).length >= Object.keys(places).length,
    '문단 수를 읽지 못함 (contents.ts 모양이 바뀌었는지 확인)',
  )
  for (const [id, levels] of Object.entries(counts)) {
    const list = PLACE_PHOTOS[id] ?? []
    for (const [level, paragraphs] of Object.entries(levels)) {
      const shown = layoutPhotos(list, paragraphs).flat().length
      assert.equal(shown, list.length, `${id} ${level}: 사진 ${list.length}장 중 ${shown}장만 화면에 들어감`)
    }
  }
})

test('배치 규칙: 1장은 첫 문단 뒤, 2장 이상은 문단 사이에 고르게, 모자라면 남는 사진은 자리 0', () => {
  const at = (n, m) =>
    layoutPhotos(
      Array.from({ length: n }, (_, i) => i),
      m,
    )
      .map((slot) => slot.join(''))
      .join('|')
  assert.equal(at(1, 3), '0|||') // 1장: 첫 문단 뒤
  assert.equal(at(3, 3), '0|1|2|') // 문단 사이 3곳에 고르게
  assert.equal(at(3, 2), '02|1|') // 문단 사이 2곳 → 남는 1장은 자리 0
  assert.equal(at(3, 1), '012|') // 문단 사이 1곳 → 남는 2장은 자리 0
  assert.equal(at(2, 3), '0||1|') // 2장은 고르게
  assert.equal(at(3, 0), '012|') // 자세히 읽기 문단이 없어도 사진은 빠지지 않는다
})
