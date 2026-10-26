import type { CSSProperties } from 'react'
import { characterFor, findItem } from '../data/avatar'
import type { AvatarLook, Equipped, HistoryItem, ItemCategory } from '../types'

// 그림 캐릭터 아바타 (아바타 탭, 내 정보, 사이드 메뉴, 대결 화면, 온보딩 미리보기)
// 고른 머리 모양의 캐릭터 그림 위에 착용한 아이템을 보여준다.
// 아이템 꾸미기 방식이 정해지기 전까지는 부위별 자리에 작은 원형 배지로 띄운다.
// 아이템에 art(옷 그림)를 넣으면 그 아이템만 배지 대신 캐릭터 위에 그림으로 겹쳐진다.

const SLOTS: ItemCategory[] = ['의복', '장비', '무기']

export function CharacterAvatar({
  look,
  equipped = {},
  className = '',
  label = '아바타',
}: {
  look: Pick<AvatarLook, 'gender' | 'style'>
  /** 비워 두면 아이템 없이 캐릭터만 그린다 (작은 프로필 사진처럼 배지가 들어갈 자리가 없을 때) */
  equipped?: Equipped
  className?: string
  label?: string
}) {
  const character = characterFor(look)
  // 동그란 프로필 칸에서 얼굴을 가운데 맞출 때 쓰는 얼굴 높이 (CSS --face-y)
  const style = { '--face-y': character.face.y } as CSSProperties
  return (
    <div className={`character-avatar ${className}`} style={style} role="img" aria-label={label}>
      <img className="character-base" src={character.image} alt="" draggable={false} />
      {SLOTS.map((slot) => {
        const item = findItem(equipped[slot])
        if (!item) return null
        return <ItemLayer key={slot} item={item} at={character.slots[slot]} />
      })}
    </div>
  )
}

/** 착용한 아이템 한 개: 옷 그림이 있으면 캐릭터 위에 겹치고, 없으면 배지로 보여준다 */
function ItemLayer({ item, at }: { item: HistoryItem; at: { x: number; y: number } }) {
  if (item.art) return <img className="character-layer" src={item.art} alt="" draggable={false} />
  return (
    <span className="item-badge" style={{ left: `${at.x}%`, top: `${at.y}%` }} title={item.name}>
      {item.symbol}
    </span>
  )
}
