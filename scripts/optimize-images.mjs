// 캐릭터 그림 용량 줄이기
// art/characters/ 의 원본 PNG를 읽어서 → 투명 여백을 잘라내고 → 높이를 줄이고 → 색 수를 줄여 압축한 뒤
// public/images/characters/ 에 같은 이름으로 저장한다. (실행: npm run images)
// 원본은 그대로 두므로 몇 번을 다시 실행해도 화질이 나빠지지 않는다.
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
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

// 옷을 입은 내 캐릭터 그림 목록 (me-{머리모양}-{옷}.png) → 앱이 이 목록을 보고 옷 그림으로 바꾼다
// 옷: robe(관복), hwarang(화랑 예복), armor(갑옷). 파일을 넣고 npm run images만 다시 하면 목록이 저절로 바뀐다.
const OUTFITS = ['robe', 'hwarang', 'armor']
const outfitImages = files
  .map((name) => name.replace(/\.png$/i, ''))
  .filter((name) => {
    const match = name.match(/^me-(.+)-([a-z]+)$/)
    return match !== null && OUTFITS.includes(match[2])
  })
  .map((name) => name.replace(/^me-/, ''))
  .sort()
await writeFile(
  'src/data/generated/outfitImages.ts',
  `// 이 파일은 npm run images가 art/characters의 me-{머리모양}-{옷}.png 파일을 보고 만든다. 직접 고치지 마세요.\n` +
    `export const OUTFIT_IMAGES: string[] = ${JSON.stringify(outfitImages)}\n`,
)
console.log(`옷 그림 ${outfitImages.length}장: ${outfitImages.join(', ') || '없음'}`)

// 학습 영상 장면 배경 (bg-장소id.png) → public/images/backgrounds/bg-장소id.webp
// 배경 원본(art/backgrounds/)은 용량이 커서 저장소에 올리지 않는다. 원본이 없는 컴퓨터에서는 이 단계를 건너뛴다.
const BG_SRC = 'art/backgrounds'
const BG_OUT = 'public/images/backgrounds'
const BG_WIDTH = 1280 // 전체 화면(가로 화면)에서도 흐릿하지 않을 만큼
const bgFiles = await readdir(BG_SRC)
  .then((names) => names.filter((name) => name.toLowerCase().endsWith('.png')))
  .catch(() => [])
if (bgFiles.length > 0) await mkdir(BG_OUT, { recursive: true })
for (const name of bgFiles) {
  const input = path.join(BG_SRC, name)
  const output = path.join(BG_OUT, name.replace(/\.png$/i, '.webp'))
  const result = await sharp(input)
    .resize({ width: BG_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(output)
  console.log(`${name}: ${kb((await stat(input)).size)} → ${kb(result.size)} (${result.width}×${result.height})`)
}
if (bgFiles.length === 0) console.log('배경 원본(art/backgrounds/)이 없어 배경 그림은 건너뜀')
