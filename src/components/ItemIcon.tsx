import { ItemArtView } from './ItemArtView'
import type { HistoryItem } from '../types'

// 아이템을 작은 칸(이름 칩, 착용 칸, 아바타 위 배지)에 넣는 그림. 칸 크기는 부르는 쪽 CSS가 정하고,
// 그림은 칸 안에 비율 그대로 들어간다. (아이템마다 그림이 있어서 한자 기호는 쓰지 않는다)
export function ItemIcon({ item, className = '' }: { item: HistoryItem; className?: string }) {
  return (
    <span className={`item-icon ${className}`} aria-hidden="true">
      {item.art && <ItemArtView art={item.art} label="" style={{}} />}
    </span>
  )
}
