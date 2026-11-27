// src/data/contents.ts에서 장소별 학습 글을 글자만 읽어 온다 (테스트·점검용, contents.ts를 직접 불러오지 않는다)
// 반환: { 장소id: { 쉬움: { intro, detail, paragraphs }, 보통: {...}, 어려움: {...}, didYouKnow, remember } }
import { readFile } from 'node:fs/promises'

const LITERAL = String.raw`(['"` + '`' + String.raw`])((?:\\.|(?!\1)[^\\])*)\1`
const literalAfter = (text, key) => {
  const match = text.match(new RegExp(key + String.raw`:\s*` + LITERAL, 's'))
  // 따옴표 글자를 실제 글자로 바꾼다 (우리 저장소 파일이라 그대로 계산해도 안전하다)
  return match ? Function('return ' + match[1] + match[2] + match[1])() : undefined
}

export async function readContents() {
  const text = await readFile('src/data/contents.ts', 'utf8')
  const result = {}
  for (const block of text.split(/^\s*placeId: '/m).slice(1)) {
    const id = block.slice(0, block.indexOf("'"))
    const place = { didYouKnow: literalAfter(block, 'didYouKnow'), remember: literalAfter(block, 'remember') }
    for (const level of ['쉬움', '보통', '어려움']) {
      const start = block.search(new RegExp('^\\s{6}' + level + ': \\{', 'm'))
      if (start < 0) continue
      const part = block.slice(start)
      const intro = literalAfter(part, 'intro')
      const detail = literalAfter(part, 'detail')
      place[level] = { intro, detail, paragraphs: detail ? detail.split('\n') : [] }
    }
    result[id] = place
  }
  return result
}
