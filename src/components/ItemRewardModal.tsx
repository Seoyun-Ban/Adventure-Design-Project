import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { ItemPicture } from './ItemPicture'
import { withJosa } from '../lib/korean'
import type { HistoryItem } from '../types'

// 학습 완료로 아이템을 얻었을 때: 카드가 빙글 돌며 나타난다
// (움직임 줄이기 설정에서는 돌지 않고 살며시 나타난다)
// 아이템이 여러 개면 한 장씩 차례로 보여준다.
export function ItemRewardModal({
  item,
  index,
  total,
  onWear,
  onLater,
}: {
  item: HistoryItem
  /** 몇 번째 아이템인지 (0부터) */
  index: number
  total: number
  /** 바로 입어보기 */
  onWear: () => void
  /** 나중에 */
  onLater: () => void
}) {
  return (
    <div className="modal-layer reward-layer">
      <section className="reward-modal" role="dialog" aria-modal="true" aria-labelledby="reward-title">
        <div className="reward-card" key={item.id}>
          <div className="reward-card-face">
            <span className="reward-rays" aria-hidden="true" />
            <div className="reward-art">
              {item.art ? (
                <ItemPicture item={item} size="large" />
              ) : (
                <span className="reward-symbol" aria-hidden="true">
                  {item.symbol}
                </span>
              )}
            </div>
            <span className="item-rarity">
              {item.rarity} · {item.category}
            </span>
          </div>
        </div>
        {total > 1 && (
          <p className="reward-count">
            {index + 1} / {total}
          </p>
        )}
        <h2 id="reward-title">{withJosa(item.name, '을')} 얻었어요!</h2>
        <p className="reward-desc">{item.description}</p>
        <div className="complete-actions">
          <ActionButton variant="secondary" onClick={onLater}>
            나중에
          </ActionButton>
          <ActionButton onClick={onWear}>
            <Icon name="user" size={18} /> 바로 입어보기
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
