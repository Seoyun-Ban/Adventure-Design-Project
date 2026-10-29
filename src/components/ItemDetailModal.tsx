import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { ItemPicture } from './ItemPicture'
import { findPlace } from '../data/places'
import type { HistoryItem } from '../types'

export function ItemDetailModal({
  item,
  owned,
  worn,
  onToggle,
  onClose,
}: {
  item: HistoryItem
  owned: boolean
  worn: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const place = findPlace(item.placeId)
  return (
    <div className="item-modal-layer">
      <section className="item-detail-modal">
        <button
          className="icon-button item-modal-close"
          type="button"
          onClick={onClose}
          aria-label="아이템 상세 닫기"
        >
          <Icon name="close" size={19} />
        </button>
        <div className={`item-detail-art ${owned ? 'owned' : 'locked'}`}>
          {owned ? <ItemPicture item={item} size="large" /> : <span>{item.symbol}</span>}
          {!owned && (
            <i>
              <Icon name="lock" size={18} />
            </i>
          )}
        </div>
        <span className="item-rarity">
          {item.rarity} · {item.category}
        </span>
        <h2>{owned ? item.name : '아직 획득하지 못한 아이템'}</h2>
        <p>{owned ? item.description : `‘${place?.name ?? '관련 장소'}’ 학습을 완료하면 얻을 수 있어요.`}</p>
        <div className="item-stats">
          {(Object.entries(item.stats) as [keyof HistoryItem['stats'], number][]).map(([label, value]) => (
            <div key={label}>
              <span>
                <strong>{label}</strong>
                <b>{owned ? value : '?'}</b>
              </span>
              <i>
                <em style={{ width: owned ? `${value}%` : '0%' }} />
              </i>
            </div>
          ))}
        </div>
        {owned ? (
          <ActionButton variant={worn ? 'ghost' : 'primary'} onClick={onToggle}>
            {worn ? '벗기' : '착용하기'}
          </ActionButton>
        ) : (
          <ActionButton variant="ghost" onClick={onClose}>
            확인
          </ActionButton>
        )}
      </section>
    </div>
  )
}
