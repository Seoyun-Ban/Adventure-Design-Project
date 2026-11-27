import { ItemPicture } from './ItemPicture'
import { OUTFIT_OF_ITEM, characterStyles } from '../data/avatar'
import { OUTFIT_IMAGES } from '../data/generated/outfitImages'
import type { CharacterStyleId, HistoryItem } from '../types'

// 아직 못 얻은 아이템의 검은 실루엣 (잠긴 장소 미리보기와 아바타 탭 '수집한 역사 아이템'이 같이 쓴다)
// - 그림(PNG)·코드로 그린 그림(태극기)이 있는 아이템: 그 그림을 통째로 검게
// - 그림이 없는 옷 3종: 옷을 입은 캐릭터 그림(me-{머리모양}-{옷}.png)을 검게 (그 사람 모습의 실루엣)
// 이름은 부르는 쪽에서 '???'로 쓴다. 색을 검게 만드는 CSS는 .item-shadow (index.css)

/** 옷 아이템의 실루엣 그림: 내 머리 모양의 옷 그림이 있으면 그것, 없으면 있는 아무 머리 모양 */
function outfitShadowSrc(item: HistoryItem, styleId?: CharacterStyleId) {
  const outfit = OUTFIT_OF_ITEM[item.id]
  if (!outfit) return undefined
  const own = styleId && OUTFIT_IMAGES.includes(`${styleId}-${outfit}`) ? styleId : undefined
  const style =
    own ??
    (Object.keys(characterStyles) as CharacterStyleId[]).find((id) =>
      OUTFIT_IMAGES.includes(`${id}-${outfit}`),
    )
  return style ? `/images/characters/me-${style}-${outfit}.png` : undefined
}

export function ItemShadow({
  item,
  size,
  styleId,
}: {
  item: HistoryItem
  size: 'small' | 'large'
  /** 내 머리 모양 (옷 아이템의 실루엣을 내 모습에 맞춘다) */
  styleId?: CharacterStyleId
}) {
  const outfitSrc = item.art ? undefined : outfitShadowSrc(item, styleId)
  return (
    <span className="item-shadow" aria-hidden="true">
      {outfitSrc ? (
        <span className={`item-picture ${size}`}>
          <img className="character-item" src={outfitSrc} alt="" draggable={false} />
        </span>
      ) : (
        <ItemPicture item={item} size={size} />
      )}
    </span>
  )
}
