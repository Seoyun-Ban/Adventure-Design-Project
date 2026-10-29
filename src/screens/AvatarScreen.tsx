import { useState } from 'react'
import { Icon } from '../components/Icon'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { ItemDetailModal } from '../components/ItemDetailModal'
import { ItemPicture } from '../components/ItemPicture'
import { PowerInfoSheet } from '../components/PowerInfoSheet'
import { BattleRecordCard } from '../components/BattleRecordCard'
import { ChallengeShareButton } from '../components/ChallengeShareButton'
import { historyItems, battleFriends, findItem, levelFor, powerOf } from '../data/avatar'
import { BattleScreen } from './BattleScreen'
import type { BattleRecord } from '../hooks/useProgress'
import type { AvatarLook, Equipped, HistoryItem, ItemCategory } from '../types'

const SLOT_LABEL: Record<ItemCategory, string> = { 장비: '머리', 무기: '손', 의복: '몸' }

// 아바타 탭: 아이템 착용(옷 입히기), 수집 현황, 친구와 대결
export function AvatarScreen({
  nickname,
  look,
  equipped,
  completedIds,
  xp,
  battle,
  onEquip,
  onBattleEnd,
  onNotice,
}: {
  nickname: string
  look: AvatarLook
  equipped: Equipped
  completedIds: string[]
  /** 퀴즈로 모은 경험치 (레벨 계산) */
  xp: number
  battle: BattleRecord
  onEquip: (category: ItemCategory, itemId?: string) => void
  onBattleEnd: (opponent: string, won: boolean) => void
  onNotice: (message: string) => void
}) {
  const isOwned = (item: HistoryItem) => completedIds.includes(item.placeId)
  const ownedCount = historyItems.filter(isOwned).length
  const level = levelFor(xp)
  const power = powerOf(equipped, level)
  const [category, setCategory] = useState<ItemCategory>('장비')
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [view, setView] = useState<'inventory' | 'friends' | 'battle'>('inventory')
  const [opponent, setOpponent] = useState(battleFriends[0])
  const [powerInfo, setPowerInfo] = useState(false)
  /** '다시 도전'을 누를 때마다 바꿔서 대결 화면을 처음부터 다시 시작한다 */
  const [battleRound, setBattleRound] = useState(0)
  const filteredItems = historyItems.filter((item) => item.category === category)

  function startBattle(friend: (typeof battleFriends)[number]) {
    setOpponent(friend)
    setBattleRound((round) => round + 1)
    setView('battle')
  }

  if (view === 'friends') {
    return (
      <section className="content-screen tab-screen avatar-screen competition-screen">
        <header className="avatar-subhead">
          <button
            className="icon-button plain"
            type="button"
            onClick={() => setView('inventory')}
            aria-label="아바타로 돌아가기"
          >
            <Icon name="arrow" />
          </button>
          <div>
            <p className="eyebrow">역사 지식 대결</p>
            <h2>친구 선택</h2>
          </div>
          <span />
        </header>
        <div className="competition-intro">
          <Icon name="quiz" size={25} />
          <div>
            <strong>누구와 대결할까요?</strong>
            <span>문제를 맞혀 상대의 체력을 먼저 0으로 만드세요.</span>
          </div>
        </div>
        <div className="challenge-invite">
          <div>
            <strong>진짜 친구에게 도전해 볼까요?</strong>
            <span>내 아바타가 담긴 도전장 링크를 보내요.</span>
          </div>
          <ChallengeShareButton me={{ nickname, look, equipped, level }} onNotice={onNotice} />
        </div>
        <h3 className="section-title">내 대결 기록</h3>
        <BattleRecordCard battle={battle} />
        <h3 className="section-title">대결 상대</h3>
        <div className="friend-list">
          {battleFriends.map((friend) => (
            <button type="button" key={friend.id} onClick={() => startBattle(friend)}>
              <span className={`friend-avatar ${friend.color}`}>{friend.name.slice(0, 1)}</span>
              <span>
                <small>{friend.title}</small>
                <strong>{friend.name}</strong>
                <i>
                  Lv. {friend.level} · 전투력 {powerOf(friend.equipped, friend.level).total.toLocaleString()}
                </i>
              </span>
              <span className="challenge-label">대결</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (view === 'battle') {
    return (
      <BattleScreen
        key={battleRound}
        me={{ nickname, look, equipped, level }}
        opponent={opponent}
        onFinish={(won) => onBattleEnd(opponent.name, won)}
        onRetry={() => setBattleRound((round) => round + 1)}
        onExit={() => setView('friends')}
      />
    )
  }

  return (
    <section className="content-screen tab-screen avatar-screen">
      <header className="avatar-main-head">
        <div>
          <p className="eyebrow">나만의 탐험가</p>
          <h2>아바타</h2>
          <span>역사 아이템으로 능력치를 키워보세요.</span>
        </div>
      </header>
      <div className="avatar-stage">
        <div className="sun-disc" />
        <CharacterAvatar
          className="stage-avatar"
          look={look}
          equipped={equipped}
          label={`${nickname}의 아바타`}
        />
        <span className="avatar-shadow" />
        <div className="avatar-power">
          <span>
            총 전투력
            <button
              type="button"
              className="power-info-button"
              onClick={() => setPowerInfo(true)}
              aria-label="전투력 올리는 방법 보기"
            >
              i
            </button>
          </span>
          <strong>{power.total.toLocaleString()}</strong>
        </div>
        <div className="level-banner">
          {nickname} · Lv. {level}
        </div>
      </div>
      <div className="equip-slots">
        {(['장비', '무기', '의복'] as ItemCategory[]).map((slot) => {
          const item = findItem(equipped[slot])
          return (
            <button
              type="button"
              key={slot}
              className={item ? 'filled' : ''}
              onClick={() => (item ? setSelectedItem(item) : setCategory(slot))}
            >
              <span className="slot-art">{item ? item.symbol : '+'}</span>
              <span>
                <small>
                  {SLOT_LABEL[slot]} · {slot}
                </small>
                <strong>{item ? item.shortName : '비어 있음'}</strong>
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" className="competition-button" onClick={() => setView('friends')}>
        <span className="competition-icon">
          <Icon name="quiz" size={24} />
        </span>
        <span>
          <strong>경쟁</strong>
          <small>친구와 역사 대결 · 기록 보기</small>
        </span>
        <Icon name="chevron" size={20} />
      </button>
      <div className="inventory-heading">
        <h3 className="section-title">수집한 역사 아이템</h3>
        <span>
          {ownedCount} / {historyItems.length}
        </span>
      </div>
      <div className="item-category-tabs">
        {(['장비', '무기', '의복'] as ItemCategory[]).map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? 'active' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="history-item-grid">
        {filteredItems.map((item) => {
          const owned = isOwned(item)
          const worn = equipped[item.category] === item.id
          return (
            <button
              type="button"
              key={item.id}
              className={`${owned ? 'owned' : 'locked'} ${worn ? 'worn' : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <span className="item-art">
                {/* 얻은 아이템은 그림으로, 아직 못 얻은 아이템은 기호로 */}
                {owned ? <ItemPicture item={item} size="small" /> : <b>{item.symbol}</b>}
                {!owned && (
                  <i>
                    <Icon name="lock" size={14} />
                  </i>
                )}
                {worn && <em>착용 중</em>}
              </span>
              <small>{item.rarity}</small>
              <strong>{owned ? item.shortName : '미획득 아이템'}</strong>
            </button>
          )
        })}
      </div>
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          owned={isOwned(selectedItem)}
          worn={equipped[selectedItem.category] === selectedItem.id}
          onToggle={() => {
            const worn = equipped[selectedItem.category] === selectedItem.id
            onEquip(selectedItem.category, worn ? undefined : selectedItem.id)
            setSelectedItem(null)
          }}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {powerInfo && <PowerInfoSheet level={level} power={power} onClose={() => setPowerInfo(false)} />}
    </section>
  )
}
