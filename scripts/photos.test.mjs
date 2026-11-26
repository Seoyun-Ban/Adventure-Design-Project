// 학습 글 사진이 하나도 빠지지 않는지 검사한다 (실행: npm test)
// 1) sources.csv에 출처가 적힌 사진 수 = 앱 목록(photos.ts)의 사진 수, 줄인 사진 파일도 public에 있음
// 2) 장소별 사진 수 = 화면에 들어가는 사진 수 (문단 수가 몇 개든, 학습 단계가 어떻든)
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'
import { isPortrait, layoutPhotos, stageRatioOf } from '../src/lib/photoLayout.ts'
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
      if (!match)
        continue
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
    assert.equal(
      inApp,
      expected[id] ?? 0,
      `${id}: csv ${expected[id] ?? 0}장 ↔ 앱 ${inApp}장 (npm run images를 했는지 확인)`,
    )
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
      assert.equal(
        placed.length,
        list.length,
        `${id}, 문단 ${paragraphs}개: ${list.length}장 중 ${placed.length}장만 배치됨`,
      )
      assert.equal(
        new Set(placed.map((p) => p.src)).size,
        list.length,
        `${id}, 문단 ${paragraphs}개: 같은 사진이 겹침`,
      )
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

test('앱의 사진 순서 = sources.csv에 적힌 순서', () => {
  const order = {}
  for (const row of sources) {
    const id = placeIdOf(row.place, places)
    if (id && row.credit) (order[id] ??= []).push(row.file.replace(/\.[^.]+$/, ''))
  }
  for (const [id, files] of Object.entries(order)) {
    const inApp = (PLACE_PHOTOS[id] ?? []).map((p) =>
      p.src
        .split('/')
        .pop()
        .replace(/\.[^.]+$/, ''),
    )
    assert.deepEqual(inApp, files, `${id}: 사진 순서가 csv와 다름`)
  }
})

test('화면에 나오는 순서(위→아래, 한 자리 안은 왼쪽→오른쪽) = 사진 원래 순서', () => {
  for (let count = 0; count <= 6; count++) {
    const photos = Array.from({ length: count }, (_, i) => i)
    for (let paragraphs = 0; paragraphs <= 8; paragraphs++) {
      assert.deepEqual(
        layoutPhotos(photos, paragraphs).flat(),
        photos,
        `사진 ${count}장, 문단 ${paragraphs}개: 순서가 바뀜`,
      )
    }
  }
})

test('배치 규칙: 1장은 첫 문단 뒤, 2장 이상은 문단 사이에 고르게, 모자라면 남는 사진은 마지막 자리(글 끝)', () => {
  // 자리는 '|'로 나눈다: 자리 0 | 자리 1 | ... | 마지막 자리(글 끝)
  const at = (n, m) =>
    layoutPhotos(
      Array.from({ length: n }, (_, i) => i),
      m,
    )
      .map((slot) => slot.join(''))
      .join('|')
  assert.equal(at(1, 3), '0|||') // 1장: 첫 문단 뒤
  assert.equal(at(3, 3), '0|1|2|') // 문단 사이 3곳에 고르게
  assert.equal(at(2, 3), '0||1|') // 2장은 고르게
  assert.equal(at(3, 2), '0|1|2') // 문단 사이 2곳 → 남는 1장은 글 끝
  assert.equal(at(3, 1), '0|12') // 문단 사이 1곳 → 남는 2장은 글 끝에 함께
  assert.equal(at(3, 0), '0|12') // 자세히 읽기 문단이 없어도 사진은 빠지지 않는다
})

test('경복궁·수원화성 단계별 배치(사진 3장)', async () => {
  const counts = await detailParagraphCounts()
  const show = (id, level) =>
    layoutPhotos(
      PLACE_PHOTOS[id].map((p) =>
        p.src
          .split('/')
          .pop()
          .replace(/\.[^.]+$/, ''),
      ),
      counts[id][level],
    )
      .map((slot) => slot.join('+'))
      .join(' | ')
  assert.equal(show('gyeongbokgung', '쉬움'), 'geunjeongjeon | gyeonghoeru+gwanghwamun')
  assert.equal(show('gyeongbokgung', '보통'), 'geunjeongjeon | gyeonghoeru | gwanghwamun')
  assert.equal(show('gyeongbokgung', '어려움'), 'geunjeongjeon | gyeonghoeru | gwanghwamun | ')
  assert.equal(show('suwon', '쉬움'), 'paldalmun | seonggwak+haenggung')
  assert.equal(show('suwon', '보통'), 'paldalmun | seonggwak | haenggung')
  assert.equal(show('suwon', '어려움'), 'paldalmun | seonggwak | haenggung')
})

test('세로 사진은 자르지 않고, 묶음 안 칸 크기는 모두 같다', () => {
  const photo = (id) => PLACE_PHOTOS.bulguksa.find((p) => p.src.includes(id))
  // 다보탑·석가탑은 세로 사진, 불국사 전경은 가로 사진
  assert.ok(isPortrait(photo('dabotap')) && isPortrait(photo('seokgatap')))
  assert.ok(!isPortrait(photo('bulguksa.webp')))
  for (const list of Object.values(PLACE_PHOTOS)) {
    for (const p of list) {
      assert.ok(p.width > 0 && p.height > 0, `${p.src}: 가로·세로 크기가 없음 (npm run images)`)
    }
  }
  // 세로끼리 묶음: 가장 길쭉한 사진(석가탑 667×1000)에 맞춘 같은 칸
  assert.equal(stageRatioOf([photo('dabotap'), photo('seokgatap')]), 667 / 1000)
  // 가로·세로가 섞여도 칸 하나(가장 길쭉한 사진 기준)
  assert.equal(stageRatioOf([photo('bulguksa.webp'), photo('seokgatap')]), 667 / 1000)
  // 가로 사진만(변경금지 없음)이면 예전처럼 4:3 칸 (null)
  const gb = PLACE_PHOTOS.gyeongbokgung
  assert.equal(stageRatioOf(gb), null)
  // 변경금지 사진은 가로여도 자르지 않으므로 같은 칸에 원래 비율로
  const aunae = PLACE_PHOTOS.aunae
  assert.ok(aunae.every((p) => p.locked))
  assert.equal(stageRatioOf(aunae), Math.min(...aunae.map((p) => p.width / p.height)))
})
