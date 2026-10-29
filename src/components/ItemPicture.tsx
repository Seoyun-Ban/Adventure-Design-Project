import { ItemArtView } from './ItemArtView'
import type { HistoryItem } from '../types'

// 아이템을 크게 보여주는 그림 (아바타 탭 아이템 목록, 아이템 상세 창, 아이템 획득 카드)
// - 그림(art)이 있으면 그림, 없으면(옷 3종) 한자 기호
// - tag가 있으면 그림 옆에 세로로 붙은 작은 종이 이름표 (예: 두루마리의 '독립선언서')
// 아바타 손에 들 때는 작아서 글자가 읽히지 않으므로 이름표 없이 그림만 쓴다 (CharacterAvatar)
export function ItemPicture({ item, size }: { item: HistoryItem; size: 'small' | 'large' }) {
  return (
    <span className={`item-picture ${size}`}>
      {item.art ? (
        <ItemArtView art={item.art} label={item.name} style={{}} />
      ) : (
        <b className="item-picture-symbol" aria-hidden="true">
          {item.symbol}
        </b>
      )}
      {item.tag && (
        <span className="item-tag" aria-hidden="true">
          {item.tag}
        </span>
      )}
    </span>
  )
}
