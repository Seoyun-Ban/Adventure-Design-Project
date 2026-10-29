// 대사 녹음 파일 목록 만들기
// public/audio/장소id/줄번호.mp3 파일을 찾아서 src/data/generated/audioFiles.ts에 목록으로 적는다.
// 앱은 이 목록에 있는 파일만 재생하고, 없는 파일은 서버에 요청하지 않는다.
// npm run dev, npm run build를 할 때 저절로 실행된다. (직접 실행: node scripts/list-audio.mjs)
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'public/audio'
const files = []
const places = await readdir(ROOT, { withFileTypes: true }).catch(() => [])
for (const place of places) {
  if (!place.isDirectory()) continue
  const names = await readdir(path.join(ROOT, place.name))
  for (const name of names) {
    if (/^\d+\.mp3$/i.test(name)) files.push(`${place.name}/${name.replace(/\.mp3$/i, '')}`)
  }
}
files.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
await writeFile(
  'src/data/generated/audioFiles.ts',
  `// 이 파일은 scripts/list-audio.mjs가 public/audio의 녹음 파일(장소id/줄번호.mp3)을 보고 만든다. 직접 고치지 마세요.\n` +
    `export const AUDIO_FILES: string[] = ${JSON.stringify(files)}\n`,
)
console.log(`녹음 파일 ${files.length}개${files.length ? `: ${files.join(', ')}` : ''}`)
