import type { CSSProperties } from 'react'
import { Taegukgi } from './Taegukgi'
import type { ItemArt } from '../types'

// 아이템 그림 한 장 (PNG 또는 코드로 그린 그림). 위치·크기는 부르는 쪽(CharacterAvatar)이 style로 정한다.

/** 코드로 그린 아이템의 그림판 크기 (가로, 세로) */
const VIEWBOX: Record<Exclude<ItemArt['kind'], 'image'>, [number, number]> = {
  taegukgi: [52, 110],
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
      <WavingFlag />
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
