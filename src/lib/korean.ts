// 한국어 조사 고르기: 앞 낱말의 받침에 맞게 이/가, 을/를, 과/와, 으로/로를 붙인다.

/** 받침이 있는지 (숫자로 끝나면 읽는 소리 기준) */
export function hasBatchim(word: string) {
  const last = word.trim().slice(-1)
  const code = last.charCodeAt(0) - 0xac00
  if (code >= 0 && code <= 11171) return code % 28 !== 0
  return '0136781'.includes(last)
}

/** 받침이 ㄹ인지 ('으로' 대신 '로'를 쓴다) */
function isRieul(word: string) {
  const code = word.trim().slice(-1).charCodeAt(0) - 0xac00
  return code >= 0 && code % 28 === 8
}

export type Josa = '이' | '을' | '과' | '으로'

/** 낱말에 맞는 조사만 돌려준다. 예: josa('세종', '과') → '과', josa('정조', '과') → '와' */
export function josa(word: string, kind: Josa) {
  const b = hasBatchim(word)
  if (kind === '이') return b ? '이' : '가'
  if (kind === '을') return b ? '을' : '를'
  if (kind === '과') return b ? '과' : '와'
  return b && !isRieul(word) ? '으로' : '로'
}

/** 낱말 뒤에 알맞은 조사를 붙인다. 예: withJosa('세종', '과') → '세종과' */
export function withJosa(word: string, kind: Josa) {
  return word + josa(word, kind)
}
