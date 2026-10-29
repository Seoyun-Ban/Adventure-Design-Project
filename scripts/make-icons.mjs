// 앱 아이콘 만들기: 초록 바탕에 흰 발자국 (앱 안의 발자국 아이콘 Icon.tsx의 footprint와 같은 모양)
// - public/favicon.svg          브라우저 탭 아이콘 (작게 보여도 잘 보이게 발자국을 크게, 모서리 둥글게)
// - public/apple-touch-icon.png 아이폰 '홈 화면에 추가' (180×180, 모서리는 아이폰이 알아서 둥글게 깎는다)
// - public/icon-192.png, icon-512.png  안드로이드 '홈 화면에 추가' (manifest.webmanifest)
// 실행: node scripts/make-icons.mjs  (발자국 모양이나 색을 바꿀 때만 다시 실행)
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const GREEN = '#174e3a'

// 발 하나 (Icon.tsx의 Foot과 같은 좌표)
const FOOT =
  '<path d="M1 7C1 5.2 2.8 4.4 4.8 4.4C6.9 4.4 8.3 5.4 8.2 7.3C8.1 9.2 7.2 10.6 7 12.2C6.8 14 5.8 15 4.5 15C3.1 15 2.2 14 2.3 12.6C2.4 11.3 2.8 10.4 2.4 9.3C2.1 8.5 1 8.3 1 7Z"/>' +
  '<circle cx="2.3" cy="3" r="1.55"/><circle cx="4.9" cy="2" r="1"/><circle cx="7" cy="2.55" r="0.88"/>' +
  '<circle cx="8.55" cy="3.65" r="0.76"/><circle cx="9.45" cy="5" r="0.64"/>'
// 왼발·오른발 (Icon.tsx의 footprint와 같은 배치, 24×24 칸 기준). 가운데는 대략 (12.25, 11.5)
const FEET =
  `<g transform="translate(11.4 7.9) rotate(-5) scale(-0.98 0.98)">${FOOT}</g>` +
  `<g transform="translate(12.7 -0.6) rotate(5) scale(0.98)">${FOOT}</g>`

/** 32×32 칸 가운데에 발자국을 scale배로 놓은 아이콘 */
function iconSvg({ scale, radius }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="${radius}" fill="${GREEN}"/>` +
    `<g fill="#fff" transform="translate(16 16) scale(${scale}) translate(-12.25 -11.5)">${FEET}</g>` +
    `</svg>\n`
  )
}

// 탭 아이콘: 16px로 작게 보이므로 발자국을 칸에 꽉 차게
const favicon = iconSvg({ scale: 1.18, radius: 7 })
await writeFile('public/favicon.svg', favicon)

// 홈 화면 아이콘: 기기가 모서리를 깎거나 동그랗게 잘라도 발자국이 남도록 여백을 넉넉히 (네모 꽉 채운 바탕)
const homeIcon = Buffer.from(iconSvg({ scale: 0.82, radius: 0 }))
for (const [file, size] of [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
]) {
  await sharp(homeIcon, { density: (72 * size) / 32 }).resize(size, size).png().toFile(file)
  console.log(`${file} (${size}×${size})`)
}
console.log('public/favicon.svg')
