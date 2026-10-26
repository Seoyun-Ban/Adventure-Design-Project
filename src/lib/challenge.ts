import { characterStyles, findItem } from '../data/avatar'
import { places } from '../data/places'
import type { AvatarLook, CharacterStyleId, Equipped, ItemCategory } from '../types'

// 친구에게 보내는 도전장 링크 (서버 없이 링크 안에 정보를 담는다)
// - 담는 것: 닉네임, 성별·머리 모양, 착용 아이템, 레벨. 얼굴 사진은 절대 담지 않는다.
// - 링크의 # 뒤(해시)에 넣는다. 해시는 브라우저가 서버로 보내지 않는다.
// - 전투력은 담지 않고, 받는 쪽에서 아이템과 레벨로 같은 공식(powerOf)을 써서 다시 계산한다.
//   (숫자를 고쳐 전투력을 부풀린 링크를 막기 위해)
// - 읽을 때 값이 하나라도 이상하면 '읽을 수 없는 도전장'으로 처리한다.

const VERSION = 1
const HASH_KEY = 'challenge'
const NICKNAME_MAX = 10
/** 앱에서 나올 수 있는 가장 높은 레벨 (= 1 + 장소 수) */
const MAX_LEVEL = 1 + places.length
const SLOTS: ItemCategory[] = ['장비', '무기', '의복']

/** 도전장을 보낸 사람의 아바타 */
export type Challenger = {
  nickname: string
  look: AvatarLook
  equipped: Equipped
  level: number
}

/** 링크에 담기는 모양 (짧게 쓰려고 한 글자 키를 쓴다) */
type Payload = {
  v: number
  n: string
  g: string
  s: string
  e: Partial<Record<ItemCategory, string>>
  l: number
}

/** 도전장 링크 만들기 */
export function createChallengeLink(me: Challenger) {
  const payload: Payload = {
    v: VERSION,
    n: me.nickname,
    g: me.look.gender,
    s: me.look.style ?? '',
    e: Object.fromEntries(SLOTS.filter((slot) => me.equipped[slot]).map((slot) => [slot, me.equipped[slot]])),
    l: me.level,
  }
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = `${HASH_KEY}=${encodeBase64Url(JSON.stringify(payload))}`
  return url.toString()
}

/**
 * 주소의 해시에서 도전장 읽기
 * - 도전장이 없으면 null
 * - 도전장이 있지만 망가졌거나 이상하면 { ok: false }
 */
export function readChallenge(hash: string): { ok: true; challenger: Challenger } | { ok: false } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const raw = params.get(HASH_KEY)
  if (raw === null) return null
  try {
    if (raw.length > 2000) throw new Error('too long')
    const data = JSON.parse(decodeBase64Url(raw)) as Partial<Payload>
    return { ok: true, challenger: validate(data) }
  } catch {
    return { ok: false }
  }
}

/** 주소에서 도전장 부분을 지운다 (새로고침해도 다시 열리지 않게) */
export function clearChallengeHash() {
  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState(null, '', url.toString())
}

function validate(data: Partial<Payload>): Challenger {
  if (data.v !== VERSION) throw new Error('version')
  const nickname = typeof data.n === 'string' ? data.n.replace(/[\u0000-\u001f\u007f]/g, '').trim() : ''
  if (!nickname || [...nickname].length > NICKNAME_MAX) throw new Error('nickname')
  if (data.g !== '남' && data.g !== '여') throw new Error('gender')
  const gender = data.g
  // 머리 모양: 비어 있으면 성별 기본값. 값이 있는데 앱에 없거나 성별과 맞지 않으면 이상한 도전장
  if (data.s !== undefined && typeof data.s !== 'string') throw new Error('style')
  let style: CharacterStyleId | undefined
  if (data.s) {
    if (!Object.prototype.hasOwnProperty.call(characterStyles, data.s)) throw new Error('style')
    style = data.s as CharacterStyleId
    if (characterStyles[style].gender !== gender) throw new Error('style')
  }
  if (!Number.isInteger(data.l) || (data.l as number) < 1 || (data.l as number) > MAX_LEVEL)
    throw new Error('level')
  const equipped: Equipped = {}
  for (const [slot, id] of Object.entries(data.e ?? {})) {
    const item = findItem(id)
    // 없는 아이템이거나 맞지 않는 부위에 넣은 아이템이면 이상한 도전장
    if (!item || item.category !== slot) throw new Error('item')
    equipped[item.category] = item.id
  }
  return {
    nickname,
    look: { gender, style, body: '보통', hair: gender === '남' ? '짧은 머리' : '긴 머리', skin: '#f2c9a0' },
    equipped,
    level: data.l as number,
  }
}

/** 한글이 들어간 글자를 링크에 넣을 수 있는 문자(base64url)로 바꾼다 */
function encodeBase64Url(text: string) {
  let binary = ''
  new TextEncoder().encode(text).forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(text: string) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

/**
 * 도전장 보내기: 휴대폰(공유 기능이 있는 기기)은 공유하기 창, 컴퓨터는 링크 복사.
 * 둘 다 안 되면 'manual'을 돌려준다 (화면에 링크를 보여주고 직접 복사하게 한다).
 */
export async function shareChallenge(
  link: string,
  nickname: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'manual'> {
  const text = `${nickname}의 역사 지식 도전장이 도착했어요! 받아 줄래요?`
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.share) {
    try {
      await navigator.share({ title: '역사 한걸음 도전장', text, url: link })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(link)
    return 'copied'
  } catch {
    return 'manual'
  }
}
