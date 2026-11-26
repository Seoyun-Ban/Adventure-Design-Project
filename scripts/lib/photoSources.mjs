// 사진 목록(art/photos/sources.csv)을 읽고 쓰는 공용 도구 (npm run images, npm run photos가 함께 쓴다)
import { readFile, writeFile } from 'node:fs/promises'

export const PHOTO_DIR = 'art/photos'
export const CSV_PATH = `${PHOTO_DIR}/sources.csv`
export const CSV_HEADER = ['장소', '파일 이름', '사진 설명', '출처', '페이지 주소', '자르기', '변경금지']

/** src/data/places.ts에서 장소 id와 이름을 읽는다 → { id: 이름 } */
export async function readPlaces() {
  const source = await readFile('src/data/places.ts', 'utf8')
  const places = {}
  for (const match of source.matchAll(/id: '(\w+)',\s*\n\s*name: '([^']+)'/g)) places[match[1]] = match[2]
  return places
}

/** CSV의 '장소' 칸(이름이든 id든)을 장소 id로 바꾼다. 못 찾으면 undefined */
export function placeIdOf(label, places) {
  const text = label.trim()
  if (places[text]) return text
  const hit = Object.entries(places).find(
    ([, name]) => name === text || name.replace(/\s/g, '') === text.replace(/\s/g, ''),
  )
  if (hit) return hit[0]
  if (text.includes('아우내')) return 'aunae' // '아우내 기념공원' 등 다른 이름으로 적은 경우
  return undefined
}

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const input = text.replace(/^﻿/, '')
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((value) => value.trim() !== '')) rows.push(row)
  return rows
}

/** sources.csv → [{ place, file, caption, credit, url, crop, locked }] (장소는 원래 적은 글자 그대로) */
export async function readSources() {
  const text = await readFile(CSV_PATH, 'utf8').catch(() => '')
  const [header, ...rows] = parseCsv(text)
  if (!header) return []
  const col = (name) => header.findIndex((h) => h.trim() === name)
  const idx = Object.fromEntries(CSV_HEADER.map((name) => [name, col(name)]))
  const get = (row, name) => (idx[name] >= 0 ? (row[idx[name]] ?? '').trim() : '')
  return rows.map((row) => {
    const crop = get(row, '자르기')
    // 변경금지 칸이 'O'·'변경금지' 등으로 표시됐거나, 자르기 칸에 '변경금지'라고 적은 경우 모두 원본 그대로 쓰는 사진
    const locked = get(row, '변경금지') !== '' || crop === '변경금지'
    return {
      place: get(row, '장소'),
      file: get(row, '파일 이름'),
      caption: get(row, '사진 설명'),
      credit: get(row, '출처'),
      url: get(row, '페이지 주소'),
      crop: crop === '변경금지' ? '' : crop,
      locked,
    }
  })
}

const quote = (value) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

export async function writeSources(entries) {
  const lines = [CSV_HEADER.join(',')]
  for (const e of entries)
    lines.push(
      [e.place, e.file, e.caption, e.credit, e.url, e.crop, e.locked ? '변경금지' : ''].map(quote).join(','),
    )
  await writeFile(CSV_PATH, '﻿' + lines.join('\r\n') + '\r\n')
}
