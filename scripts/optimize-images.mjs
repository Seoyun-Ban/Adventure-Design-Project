// 캐릭터 그림 용량 줄이기
// art/characters/ 의 원본 PNG를 읽어서 → 투명 여백을 잘라내고 → 높이를 줄이고 → 색 수를 줄여 압축한 뒤
// public/images/characters/ 에 같은 이름으로 저장한다. (실행: npm run images)
// 원본은 그대로 두므로 몇 번을 다시 실행해도 화질이 나빠지지 않는다.
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { PHOTO_DIR, placeIdOf, readPlaces, readSources } from './lib/photoSources.mjs'

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
  console.log(
    `${name}: ${kb((await stat(input)).size)} → ${kb(result.size)} (${result.width}×${result.height})`,
  )
}
if (bgFiles.length === 0) console.log('배경 원본(art/backgrounds/)이 없어 배경 그림은 건너뜀')

// 학습 글 중간 사진 (art/photos/장소id/파일) → public/images/photos/장소id/파일.webp
// 설명·출처는 art/photos/sources.csv에서 읽어 src/data/generated/photos.ts로 만든다.
// 출처(이름)가 적혀 있지 않은 사진은 앱에 넣지 않는다 (사진 규칙: 출처 표시 필수).
const PHOTO_OUT = 'public/images/photos'
const PHOTO_WIDTH = 1000 // 휴대폰 화면(3배)에서 크게 보기를 해도 충분한 크기
const CROPS = { 위: 'top', 가운데: 'center', 아래: 'bottom', 왼쪽: 'left', 오른쪽: 'right' }
const places = await readPlaces()
const sources = await readSources()
const photos = {}
let photoCount = 0
for (const entry of sources) {
  const placeId = placeIdOf(entry.place, places)
  if (!placeId) {
    console.log(`⚠ 사진 건너뜀: 장소 '${entry.place}'를 못 찾음 (${entry.file})`)
    continue
  }
  const input = path.join(PHOTO_DIR, placeId, entry.file)
  if (!(await stat(input).catch(() => null))) {
    console.log(`⚠ 사진 건너뜀: 파일이 없음 (${input})`)
    continue
  }
  if (!entry.credit) {
    console.log(`⚠ 사진 건너뜀: 출처가 비어 있음 (${input}) — 출처를 적어야 앱에 나옵니다`)
    continue
  }
  await mkdir(path.join(PHOTO_OUT, placeId), { recursive: true })
  let outName
  if (entry.locked) {
    // 변경금지(공공누리 제3·4유형): 자르기·크기 조절·형식 바꾸기 없이 원본 파일을 그대로 복사만 한다
    outName = entry.file
    await copyFile(input, path.join(PHOTO_OUT, placeId, outName))
    console.log(
      `사진 ${placeId}/${entry.file}: 변경금지 → 원본 그대로 복사 (${kb((await stat(input)).size)})`,
    )
  } else {
    outName = entry.file.replace(/\.[^.]+$/, '') + '.webp'
    const result = await sharp(input)
      .rotate()
      .resize({ width: PHOTO_WIDTH, height: PHOTO_WIDTH, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(path.join(PHOTO_OUT, placeId, outName))
    console.log(
      `사진 ${placeId}/${entry.file}: ${kb((await stat(input)).size)} → ${kb(result.size)} (${result.width}×${result.height})`,
    )
  }
  ;(photos[placeId] ??= []).push({
    src: `/images/photos/${placeId}/${outName}`,
    caption: entry.caption,
    credit: entry.credit,
    ...(entry.url ? { url: entry.url } : {}),
    ...(entry.locked ? { locked: true } : CROPS[entry.crop] ? { crop: CROPS[entry.crop] } : {}),
  })
  photoCount++
}
await mkdir('src/data/generated', { recursive: true })
await writeFile(
  'src/data/generated/photos.ts',
  `// 이 파일은 npm run images가 art/photos/sources.csv를 보고 만든다. 직접 고치지 마세요.
` +
    `export type PlacePhoto = {
  src: string
  caption: string
  credit: string
  url?: string
  crop?: 'top' | 'center' | 'bottom' | 'left' | 'right'
  /** 변경금지(공공누리 제3·4유형): 원본 그대로, 자르기·크기 조절 없이 보여 준다 */
  locked?: true
}
` +
    `export const PLACE_PHOTOS: Record<string, PlacePhoto[]> = ${JSON.stringify(photos, null, 2)}
`,
)
console.log(`학습 글 사진 ${photoCount}장`)
