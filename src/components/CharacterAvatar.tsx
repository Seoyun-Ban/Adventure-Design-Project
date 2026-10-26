import type { CSSProperties } from 'react'
import { characterFor, findItem, type CharacterStyle } from '../data/avatar'
import { ItemArtView } from './ItemArtView'
import type { AvatarLook, Equipped, HistoryItem, ItemCategory } from '../types'

// 그림 캐릭터 아바타 (아바타 탭, 내 정보, 사이드 메뉴, 대결 화면, 온보딩 미리보기, 도전장)
// 고른 머리 모양의 캐릭터 그림 위에 착용한 아이템을 입힌다.
// - 머리·손 아이템: 그림(art)이 있으면 그 그림을 머리 위·손에 겹친다. 자리는 캐릭터 그림마다 다르다(mounts).
// - 그림이 없는 아이템(지금은 옷): 부위 근처에 작은 원형 배지로 띄운다.

// 그리는 순서: 옷 배지 → 손 아이템 → 모자 (모자가 맨 위)
const SLOTS: ItemCategory[] = ['의복', '무기', '장비']

export function CharacterAvatar({
  look,
  equipped = {},
  className = '',
  label = '아바타',
}: {
  look: Pick<AvatarLook, 'gender' | 'style'>
  /** 비워 두면 아이템 없이 캐릭터만 그린다 (작은 프로필 사진처럼 아이템이 들어갈 자리가 없을 때) */
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
        return <ItemLayer key={slot} item={item} character={character} />
      })}
    </div>
  )
}

/** 착용한 아이템 한 개: 그림이 있으면 머리·손 자리에 겹치고, 없으면 배지로 보여준다 */
function ItemLayer({ item, character }: { item: HistoryItem; character: CharacterStyle }) {
  const art = item.art
  if (!art || item.category === '의복') {
    const at = character.slots[item.category]
    return (
      <span className="item-badge" style={{ left: `${at.x}%`, top: `${at.y}%` }} title={item.name}>
        {item.symbol}
      </span>
    )
  }
  // 아이템의 맞춤점(anchor)이 캐릭터의 자리(머리: 이마선, 손: 손바닥)에 오도록 옮긴다
  const { head, hand } = character.mounts
  const onHead = item.category === '장비'
  const mount = onHead ? head : hand
  const style: CSSProperties = {
    left: `${mount.x}%`,
    top: `${mount.y}%`,
    transform: `translate(-${art.anchor.x}%, -${art.anchor.y}%)`,
    // 모자 너비는 그 캐릭터의 머리 너비에, 손 아이템 높이는 캐릭터 키에 비례한다
    width: onHead && art.width ? `${art.width * head.w}%` : undefined,
    height: art.height ? `${art.height}%` : undefined,
  }
  if (!art.split) return <ItemArtView art={art} label={item.name} style={style} />
  // 모자: 테두리 위쪽은 캐릭터 앞에 그리고, 아래쪽(갓끈·투구 목가리개)은 얼굴을 가리지 않게 뒤에 그리거나 뺀다
  return (
    <>
      {art.below !== 'hide' && (
        <ItemArtView
          art={art}
          label=""
          style={{ ...style, zIndex: 0, clipPath: `inset(${art.split}% 0 0 0)` }}
        />
      )}
      <ItemArtView
        art={art}
        label={item.name}
        style={{ ...style, zIndex: 2, clipPath: `inset(0 0 ${100 - art.split}% 0)` }}
      />
    </>
  )
}
