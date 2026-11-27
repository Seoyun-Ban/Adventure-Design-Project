import { ItemPicture } from './ItemPicture'
import type { HistoryItem } from '../types'

// 아직 못 얻은 아이템의 검은 실루엣 (잠긴 장소 미리보기와 아바타 탭 '수집한 역사 아이템'이 같이 쓴다)
// 아이템 그림(PNG)이나 코드로 그린 그림(태극기)을 통째로 검게 만든다. 이름은 부르는 쪽에서 '???'로 쓴다.
// 색을 검게 만드는 CSS는 .item-shadow (index.css)
export function ItemShadow({ item, size }: { item: HistoryItem; size: 'small' | 'large' }) {
  return (
    <span className="item-shadow" aria-hidden="true">
      <ItemPicture item={item} size={size} />
    </span>
  )
}
