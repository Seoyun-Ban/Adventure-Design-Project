// 캐릭터 그림 용량 줄이기
// art/characters/ 의 원본 PNG를 읽어서 → 투명 여백을 잘라내고 → 높이를 줄이고 → 색 수를 줄여 압축한 뒤
// public/images/characters/ 에 같은 이름으로 저장한다. (실행: npm run images)
// 원본은 그대로 두므로 몇 번을 다시 실행해도 화질이 나빠지지 않는다.
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'art/characters'
const OUT = 'public/images/characters'
const MAX_HEIGHT = 720 // 화면에는 약 150px로 보이므로, 선명한 휴대폰 화면(3배)에서도 충분한 크기

await mkdir(OUT, { recursive: true })
const files = (await readdir(SRC)).filter((name) => name.toLowerCase().endsWith('.png'))

for (const name of files) {
  const input = path.join(SRC, name)
  const output = path.join(OUT, name)
  const trimmed = await sharp(input).trim().toBuffer({ resolveWithObject: true })
  const result = await sharp(trimmed.data)
    .resize({ height: MAX_HEIGHT, withoutEnlargement: true })
    .png({ palette: true, quality: 90, effort: 10 })
    .toFile(output)
  const before = (await stat(input)).size
  console.log(
    `${name}: ${kb(before)} → ${kb(result.size)} (${result.width}×${result.height}, ` +
      `잘라낸 여백 왼쪽 ${-trimmed.info.trimOffsetLeft}px 위 ${-trimmed.info.trimOffsetTop}px, ` +
      `원본 ${trimmed.info.width}×${trimmed.info.height})`,
  )
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)}KB`
}
