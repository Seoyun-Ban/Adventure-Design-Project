import { ItemArtView } from './ItemArtView'
import type { HistoryItem } from '../types'

/**
 * 아이템 그림이 아직 없을 때 대신 보여주는 단순한 보따리 그림.
 * (아이템 목록·상세 창·획득 카드는 className='character-item'으로, 작은 칸은 ItemIcon이 크기를 맞춘다)
 */
export function ItemBundle({ className = '' }: { className?: string }) {
  return (
    <svg className={`item-bundle ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 8c-3.2 0-4.6 3-3.4 5.2C14 16.4 8 23.6 8 32c0 6 6.4 9 16 9s16-3 16-9c0-8.4-6-15.6-12.6-18.8C28.6 11 27.2 8 24 8z"
        fill="#e0bf82"
        stroke="#8a6a35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15.5c3.4 2.6 7.6 2.6 11 0"
        fill="none"
        stroke="#8a6a35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 9.5c1.6-2.6 3.6-2.6 5-.8M29 9.5c-1.6-2.6-3.6-2.6-5-.8"
        fill="none"
        stroke="#8a6a35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// 아이템을 작은 칸(이름 칩, 착용 칸, 아바타 위 배지)에 넣는 그림. 칸 크기는 부르는 쪽 CSS가 정하고,
// 그림은 칸 안에 비율 그대로 들어간다. 그림이 없는 아이템은 보따리 그림.
// tilt: 활·검처럼 아주 길쭉한 그림(가로:세로가 1:4보다 가늘다)을 45도 눕혀 칸 안에 더 크게 넣는다 (이름 칩, 착용 칸)
const TILTED_SRC = ['/images/characters/item-bow.png', '/images/characters/item-sword.png']

export function ItemIcon({
  item,
  className = '',
  tilt = false,
}: {
  item: HistoryItem
  className?: string
  tilt?: boolean
}) {
  const tilted = tilt && item.art?.kind === 'image' && TILTED_SRC.includes(item.art.src)
  return (
    <span className={`item-icon ${tilted ? 'tilted' : ''} ${className}`} aria-hidden="true">
      {item.art ? (
        <ItemArtView art={item.art} label="" style={{}} />
      ) : (
        <ItemBundle className="character-item" />
      )}
    </span>
  )
}
