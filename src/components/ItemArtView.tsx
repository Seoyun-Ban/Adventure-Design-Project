import type { CSSProperties } from 'react'
import { Taegukgi } from './Taegukgi'
import type { ItemArt } from '../types'

// 아이템 그림 한 장 (PNG 또는 코드로 그린 그림). 위치·크기는 부르는 쪽(CharacterAvatar)이 style로 정한다.

/** 코드로 그린 아이템의 그림판 크기 (가로, 세로) */
const VIEWBOX: Record<Exclude<ItemArt['kind'], 'image'>, [number, number]> = {
  taegukgi: [52, 110],
  declaration: [34, 70],
}

export function ItemArtView({ art, label, style }: { art: ItemArt; label: string; style: CSSProperties }) {
  if (art.kind === 'image') {
    return <img className="character-item" src={art.src} alt={label} draggable={false} style={style} />
  }
  const [w, h] = VIEWBOX[art.kind]
  return (
    <svg
      className="character-item"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      style={{ ...style, aspectRatio: `${w} / ${h}` }}
    >
      {art.kind === 'taegukgi' ? <WavingFlag /> : <DeclarationScroll />}
    </svg>
  )
}

/** 긴 깃대에 단 태극기. 깃면은 깃대 쪽을 축으로 살랑살랑 흔들린다 */
function WavingFlag() {
  return (
    <g>
      <rect x="2" y="3" width="2.6" height="107" rx="1.3" fill="#8a6440" />
      <rect x="2.6" y="3" width="0.8" height="107" fill="#b38b5f" />
      <circle cx="3.3" cy="3.2" r="2.8" fill="#e2b04a" stroke="#a87b22" strokeWidth="0.6" />
      <g className="flag-wave">
        <Taegukgi x={4.6} y={6} height={30} />
      </g>
    </g>
  )
}

/** 둘둘 말린 한지 두루마리 (글자 없음), 가운데를 붉은 끈으로 묶었다 */
function DeclarationScroll() {
  return (
    <g stroke="#a8916a" strokeWidth="0.8">
      <defs>
        <linearGradient id="hanji-roll" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#dccaa0" />
          <stop offset="0.45" stopColor="#f7eedb" />
          <stop offset="1" stopColor="#d6c296" />
        </linearGradient>
      </defs>
      {/* 살짝 풀린 종이 끝 */}
      <path d="M26 12 Q32 15 31 34 Q30 40 26 40 Z" fill="#f3e8cf" />
      <rect x="7" y="6" width="20" height="58" rx="3" fill="url(#hanji-roll)" />
      <ellipse cx="17" cy="64" rx="10" ry="3.2" fill="#e8d9b4" />
      <ellipse cx="17" cy="64" rx="4" ry="1.3" fill="#cdb684" />
      <ellipse cx="17" cy="6" rx="10" ry="3.2" fill="#efe3c6" />
      <path d="M17 6 m-6 0 a6 2 0 1 0 12 0 a4 1.4 0 1 0 -8 0 a2 0.7 0 1 0 4 0" fill="none" />
      {/* 묶은 끈 */}
      <rect x="6.6" y="33" width="20.8" height="3.2" rx="1.2" fill="#9c3b2f" stroke="#6f281f" />
      <path d="M17 36 l-3 7 M17 36 l3 7" stroke="#9c3b2f" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}
