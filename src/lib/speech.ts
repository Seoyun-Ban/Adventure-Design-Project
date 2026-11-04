// 영상 장면 대사 읽기
// 1) 녹음 파일(mp3)이 있으면 녹음만 재생한다.  예: public/audio/gyeongbokgung/1.mp3, 3-boy.mp3, 3-girl.mp3
//    있는 파일 목록은 npm run dev/build 때 scripts/list-audio.mjs가 만든다 (없는 파일은 서버에 요청하지 않는다).
// 2) 없으면 브라우저 내장 음성(Web Speech API)으로 읽는다. 기기에 있는 한국어 목소리 중 남성/여성을 골라 쓴다.
//    'Multilingual' 목소리는 한국어 전용 남성 목소리가 없을 때만 남성 역할에 쓰고, 높낮이·빠르기는 1로 고정한다.
//    읽다가 오류가 나면 다른 방법으로 다시 읽는다 (attemptsFor 참고).
// 3) 목소리 목록을 아직 못 받았으면 목소리를 고르지 않고 lang만 'ko-KR'로 정해 기본 목소리로 읽는다.
// 4) 음성 기능 자체가 없는 브라우저면 소리 없이 글자 수만큼 기다린다 (자막만 보인다).
import { AUDIO_FILES } from '../data/generated/audioFiles'

/**
 * 학습 영상 장면의 목소리(녹음 파일 재생 + 기기 목소리)를 켜고 끄는 값.
 * 지금은 꺼 두었다 (false) → 대사는 말풍선 글자가 한 글자씩 나타나는 효과로만 보여주고, 소리 버튼도 숨긴다.
 * 다시 켜려면 true로 바꾸면 된다. 녹음 파일 재생 구조는 그대로 있다.
 */
export const SCENE_VOICE_ENABLED = false

/** 대사 목소리: 남성/여성 + 높낮이·빠르기 (1이 기본) */
export type VoiceSpec = { gender: 'male' | 'female'; pitch: number; rate: number }

// 한국어 목소리 이름으로 성별을 구분한다. 앞에 적은 것일수록 먼저 고른다.
// 한 칸에 적은 이름들은 같은 목소리다. 기기 언어에 따라 이름이 한글로 나오기도 한다 (예: 'Microsoft 인준 Online (Natural)').
// (엣지: Microsoft InJoon(인준)·SunHi(선히) 등, 크롬: Google 한국의, 애플: Yuna·Minsu 등)
const PREFERRED: Record<VoiceSpec['gender'], string[][]> = {
  male: [
    ['injoon', '인준'],
    ['hyunsu', '현수'],
    ['bongjin', '봉진'],
    ['gookmin', '국민'],
    ['minsu', '민수'],
    ['jinho', '진호'],
  ],
  female: [
    ['sunhi', '선히'],
    ['jimin', '지민'],
    ['seohyeon', '서현'],
    ['yujin', '유진'],
    ['soonbok', '순복'],
    ['heami', '해미'],
    ['yuna', '유나'],
    ['sora', '소라'],
    ['google'],
  ],
}

/** 이 목소리가 PREFERRED에서 몇 번째 칸인지 (없으면 -1) */
function preferredOrder(gender: VoiceSpec['gender'], voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase()
  return PREFERRED[gender].findIndex((names) => names.some((key) => name.includes(key)))
}
const GENDER_WORDS: Record<VoiceSpec['gender'], RegExp> = {
  male: /male|남성|남자/i,
  female: /female|여성|여자/i,
}

/** 목소리를 대신 쓸 때(남성 목소리가 없어 여성 목소리로 읽는 등) 높낮이를 이 범위 안에서만 바꾼다 */
const SUBSTITUTE_PITCH: [number, number] = [0.9, 1.1]
/** 보통 때 높낮이 범위 */
const PITCH: [number, number] = [0.8, 1.25]

let cache: {
  male: SpeechSynthesisVoice | null
  female: SpeechSynthesisVoice | null
  any: SpeechSynthesisVoice | null
} | null = null

/** 기기에 있는 한국어 목소리 전부 */
function allKoreanVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
}

/** 이 장면에서 한 번 실패한 목소리 이름 (장면이 끝날 때까지 다시 고르지 않는다) */
const failedVoices = new Set<string>()

/** 인터넷으로 읽는 'Online' 목소리인지 (예: Microsoft 인준 Online (Natural)) */
function isOnline(voice: SpeechSynthesisVoice) {
  return /online/i.test(voice.name)
}

/**
 * Online 목소리가 한 번이라도 실패했는지.
 * 실패하는 기기에서는 Online 목소리가 전부 실패하는 경우가 많아서, 앱을 다시 열 때까지 Online 목소리를 모두 건너뛴다.
 * (다시 시도하느라 소리가 늦게 나오지 않게)
 */
let onlineBroken = false

function markVoiceFailed(voice: SpeechSynthesisVoice) {
  if (isOnline(voice) && !onlineBroken) {
    onlineBroken = true
    cache = null
    debugLog(`${voice.name} 실패 → 앱을 다시 열 때까지 Online 목소리는 모두 건너뜀`)
  }
  if (failedVoices.has(voice.name)) return
  failedVoices.add(voice.name)
  cache = null
  debugLog(`${voice.name} → 이 장면이 끝날 때까지 쓰지 않음`)
}

/** 장면이 끝나면 실패한 목소리 기록을 지운다 (다음 장면에서는 다시 써 본다) */
export function resetFailedVoices() {
  if (failedVoices.size === 0) return
  failedVoices.clear()
  cache = null
}

/**
 * 고를 수 있는 한국어 목소리
 * - 이 장면에서 한 번 실패한 목소리는 뺀다
 * - Online 목소리가 한 번이라도 실패했으면 Online 목소리는 모두 뺀다 (앱을 다시 열 때까지)
 * - 이름에 'Multilingual'이 들어간 여러 언어용 목소리는 남성 후보로만, 한국어 전용 남성 목소리가 없을 때 쓴다 (pickVoices)
 */
function koreanVoices() {
  return allKoreanVoices().filter(
    (voice) => !failedVoices.has(voice.name) && !(onlineBroken && isOnline(voice)),
  )
}

/** 여러 언어용 온라인 목소리 (예: Microsoft Hyunsu Multilingual Online). 높낮이·빠르기를 바꾸면 실패할 수 있다. */
function isMultilingual(voice: SpeechSynthesisVoice) {
  return /multilingual/i.test(voice.name)
}

function genderOf(voice: SpeechSynthesisVoice): VoiceSpec['gender'] | null {
  for (const gender of ['male', 'female'] as const) {
    if (preferredOrder(gender, voice) >= 0) return gender
  }
  if (GENDER_WORDS.female.test(voice.name)) return 'female'
  if (GENDER_WORDS.male.test(voice.name)) return 'male'
  return null
}

/**
 * 성별마다 가장 알맞은 한국어 목소리
 * 남성은 InJoon, 여성은 SunHi를 먼저 고르고, 없으면 PREFERRED 순서·'Online (Natural)' 순으로 다른 한국어 전용 목소리를 고른다.
 * 남성은 한국어 전용 목소리가 하나도 없을 때만 Multilingual 목소리(Hyunsu Multilingual 등)를 쓴다. 여성·any에는 쓰지 않는다.
 */
function pickVoices() {
  if (cache) return cache
  const voices = koreanVoices()
  if (voices.length === 0) return { male: null, female: null, any: null }
  const best = (gender: VoiceSpec['gender']) => {
    const candidates = voices.filter(
      (voice) => genderOf(voice) === gender && (gender === 'male' || !isMultilingual(voice)),
    )
    const rank = (voice: SpeechSynthesisVoice) => {
      // 같은 목소리면 'Online (Natural)'을 먼저, Multilingual은 한국어 전용 목소리가 하나도 없을 때만
      const order = preferredOrder(gender, voice)
      const natural = /natural/i.test(voice.name) ? 0.5 : 0
      return (isMultilingual(voice) ? 100 : 0) + (order < 0 ? 50 : order) - natural
    }
    return candidates.sort((a, b) => rank(a) - rank(b))[0] ?? null
  }
  cache = {
    male: best('male'),
    female: best('female'),
    any: voices.find((voice) => !isMultilingual(voice)) ?? null,
  }
  return cache
}

function hasSynth() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

if (hasSynth()) {
  // 목소리 목록은 늦게 도착할 수 있어서, 바뀌면 다시 고른다
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cache = null
  })
}

/** 목소리 목록이 비어 있을 때 기다리는 최대 시간 */
const VOICE_WAIT_MS = 2000
let voicesReady: Promise<void> | null = null

/**
 * 목소리 목록 미리 불러오기 (엣지·크롬은 목록을 늦게 준다).
 * 목록이 비어 있으면 voiceschanged를 최대 2초 기다린다. 장면이 열릴 때 불러서 '만나기'를 누르기 전에 끝내 둔다.
 * 누를 때까지 못 받았어도 기다리지 않고 기본 한국어 목소리로 읽는다.
 */
export function prepareVoices(): Promise<void> {
  if (!hasSynth()) return Promise.resolve()
  if (voicesReady) return voicesReady
  voicesReady = new Promise<void>((resolve) => {
    const synth = window.speechSynthesis
    const finish = () => {
      synth.removeEventListener('voiceschanged', finish)
      window.clearTimeout(timer)
      const korean = allKoreanVoices()
      const picked = pickVoices()
      debugLog(
        `목소리 목록 ${synth.getVoices().length}개 (한국어 ${korean.length}개` +
          (korean.length ? `: ${korean.map((voice) => voice.name).join(', ')}` : '') +
          `) → 남성: ${picked.male?.name ?? '없음 → 기본 목소리(ko-KR)'}, 여성: ${picked.female?.name ?? '없음'}`,
      )
      resolve()
    }
    const timer = window.setTimeout(finish, synth.getVoices().length > 0 ? 0 : VOICE_WAIT_MS)
    if (synth.getVoices().length === 0) synth.addEventListener('voiceschanged', finish)
  })
  return voicesReady
}

const clamp = (value: number, [min, max]: [number, number]) => Math.min(max, Math.max(min, value))

/**
 * 한국어로 읽을 수 있는지 (자막 안내용)
 * 목록을 아직 못 받았으면 읽을 수 있다고 본다. 목록이 왔는데 한국어 목소리가 없을 때만 false.
 */
export function canSpeak() {
  if (!hasSynth()) return false
  return window.speechSynthesis.getVoices().length === 0 || allKoreanVoices().length > 0
}

/** 대사 한 줄을 읽는 방법 하나 (voice가 null이면 목소리를 고르지 않고 lang만 ko-KR) */
type Attempt = { voice: SpeechSynthesisVoice | null; pitch: number; rate: number; note: string }

/**
 * 대사를 읽을 방법들을 시도할 순서대로 만든다. 앞의 방법이 실패(synthesis-failed 등)하면 다음 방법으로 다시 읽는다.
 * - 그 성별 목소리: 원래 높낮이·빠르기 → 실패하면 높낮이·빠르기 1로 한 번 더
 *   (Multilingual 목소리는 높낮이를 바꾸면 실패할 수 있어서 처음부터 1로 고정)
 * - 남성 역할: 남성 목소리가 없거나 실패하면 여성 목소리보다 기본 목소리(ko-KR)를 먼저, 그다음에 여성 목소리
 * - 여성 역할: 여성 목소리가 없으면 다른 목소리로 대신 → 그래도 실패하면 기본 목소리(ko-KR)
 */
function attemptsFor(spec: VoiceSpec): Attempt[] {
  const voices = pickVoices()
  const own = voices[spec.gender]
  const other = (spec.gender === 'male' ? voices.female : voices.male) ?? voices.any
  const list: Attempt[] = []
  const add = (attempt: Attempt) => {
    const same = list.some(
      (a) => a.voice === attempt.voice && a.pitch === attempt.pitch && a.rate === attempt.rate,
    )
    if (!same) list.push(attempt)
  }
  const defaultVoice: Attempt = { voice: null, pitch: 1, rate: 1, note: '기본 목소리(ko-KR)로' }
  const substitute = (voice: SpeechSynthesisVoice): Attempt =>
    isMultilingual(voice)
      ? { voice, pitch: 1, rate: 1, note: '다른 목소리로 대신' }
      : {
          voice,
          pitch: clamp(spec.pitch, SUBSTITUTE_PITCH),
          rate: clamp(spec.rate, [0.8, 1.15]),
          note: '다른 목소리로 대신',
        }
  if (own) {
    const fixed = isMultilingual(own)
    add({
      voice: own,
      pitch: fixed ? 1 : clamp(spec.pitch, PITCH),
      rate: fixed ? 1 : clamp(spec.rate, [0.8, 1.15]),
      note: '',
    })
    add({ voice: own, pitch: 1, rate: 1, note: '같은 목소리, 높낮이·빠르기 1로' })
  }
  if (spec.gender === 'male') {
    add(defaultVoice)
    if (other) add(substitute(other))
  } else {
    if (!own && other) add(substitute(other))
    add(defaultVoice)
  }
  return list
}

// ---------- 녹음 파일 ----------

let currentAudio: HTMLAudioElement | null = null
/** 지금 읽고 있는 대사 (크롬·엣지는 이 값을 들고 있지 않으면 읽는 도중 사라져 끝 알림이 안 올 수 있다) */
let currentUtterance: SpeechSynthesisUtterance | null = null
/** stopSpeaking을 부를 때마다 1씩 늘린다. 기다리는 사이에 멈췄으면 그 줄은 읽지 않는다. */
let generation = 0
/** 마지막으로 기기 목소리를 끊은 시각. 끊자마자 바로 읽으면 새 줄까지 끊기는 브라우저가 있어 잠깐 기다린다. */
let lastCancelAt = -Infinity
const AFTER_CANCEL_MS = 120
/** 저장소에 있는 녹음 파일 주소 (목록에 없는 파일은 요청하지 않는다) */
const RECORDINGS = new Set(AUDIO_FILES.map((name) => `/audio/${name}.mp3`))

/** 녹음 파일 재생. 끝까지 재생하면 true, 재생할 수 없으면 false */
function playRecording(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url)
    currentAudio = audio
    let settled = false
    const done = (played: boolean) => {
      if (settled) return
      settled = true
      if (currentAudio === audio) currentAudio = null
      resolve(played)
    }
    audio.onended = () => done(true)
    audio.onerror = () => done(false)
    audio.play().catch(() => done(false))
  })
}

/** 콘솔 기록은 개발 중(npm run dev)이거나 주소 뒤에 ?debug를 붙였을 때만 남긴다 */
const DEBUG =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'))
function debugLog(message: string) {
  if (DEBUG) console.info(`[목소리] ${message}`)
}

// ---------- 대사 읽기 ----------

/**
 * 대사 한 줄을 읽고, 다 읽으면 끝나는 Promise
 * - audioUrl의 녹음 파일이 목록(AUDIO_FILES)에 있으면 그것을 재생하고, 없으면 기기 목소리로 읽는다
 * - 목소리 목록을 아직 못 받았으면 lang만 'ko-KR'로 정해 기본 목소리로 읽는다
 * - enabled가 false(소리 끔)거나 음성 기능이 없는 브라우저면 글자 수에 맞춰 기다리기만 한다
 * - 기다리지 않고 바로 읽기 시작하므로, 버튼을 누른 순간에 부르면 브라우저가 소리를 막지 않는다
 * - label: 콘솔 기록에 붙일 이름 (예: "대사 3/6 읽기 시작: 세종")
 */
export async function speak(
  text: string,
  spec: VoiceSpec,
  enabled: boolean,
  audioUrl?: string,
  label = '대사',
): Promise<void> {
  const fallbackMs = 1400 + text.length * 95
  if (!enabled) {
    debugLog(`${label} / 소리 꺼짐 (자막만)`)
    return wait(fallbackMs)
  }
  const started = generation
  // 녹음 파일이 있으면 녹음만 재생한다. 없을 때(또는 재생할 수 없을 때)만 기기 목소리로 대신 읽는다.
  if (audioUrl && RECORDINGS.has(audioUrl)) {
    debugLog(`${label} / 녹음 파일 ${audioUrl}`)
    if (await playRecording(audioUrl)) {
      debugLog(`${label} / 녹음 끝까지 재생 ✓`)
      return
    }
    if (started !== generation) return
    debugLog(`${label} / 녹음 파일을 재생하지 못함 → 기기 목소리로 대신`)
  } else if (audioUrl) {
    debugLog(`${label} / 녹음 없음(${audioUrl}) → 기기 목소리로 대신`)
  }
  if (!hasSynth()) {
    debugLog(`${label} / 음성 기능 없는 브라우저 (자막만)`)
    return wait(fallbackMs)
  }
  // 읽을 방법들 (목소리 목록을 아직 못 받았으면 ko-KR 기본 목소리 하나). 실패하면 다음 방법으로 다시 읽는다.
  const attempts = attemptsFor(spec)
  return new Promise((resolve) => {
    let done = false
    let timer = 0
    const finish = () => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      resolve()
    }
    const tryAt = (step: number) => {
      // 기다리는 사이에 다음 줄로 넘어갔거나 멈췄으면 이 줄은 읽지 않는다
      if (started !== generation) return finish()
      const attempt = attempts[step]
      // 일부 브라우저에서 onend가 오지 않는 경우 대비 (시도할 때마다 새로 잰다)
      window.clearTimeout(timer)
      timer = window.setTimeout(finish, fallbackMs + 4000)
      const name = attempt.voice ? attempt.voice.name : '기본 목소리(ko-KR)'
      const how = `${name}, 높낮이 ${attempt.pitch.toFixed(2)}·빠르기 ${attempt.rate.toFixed(2)}`
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        if (attempt.voice) utterance.voice = attempt.voice
        utterance.lang = attempt.voice?.lang ?? 'ko-KR'
        utterance.pitch = attempt.pitch
        utterance.rate = attempt.rate
        utterance.onstart = () => debugLog(`${label} / 소리 나기 시작 ✓ (${name})`)
        utterance.onend = () => {
          if (currentUtterance === utterance) currentUtterance = null
          debugLog(`${label} / 끝까지 읽음 ✓ (${name})`)
          finish()
        }
        utterance.onerror = (event) => {
          // 다음 줄로 넘기며 끊은 것(interrupted·canceled)은 정상
          if (event.error === 'interrupted' || event.error === 'canceled') {
            debugLog(`${label} / 다음으로 넘기며 멈춤 (${name})`)
            return finish()
          }
          debugLog(`목소리 오류: ${event.error} (${name})`)
          // 한 번 실패한 목소리는 이 장면이 끝날 때까지 다음 대사에서 고르지 않는다
          // Online 목소리가 실패했으면 남은 방법 중 Online 목소리는 건너뛰고 바로 다음 방법(기본 목소리 등)으로
          if (attempt.voice) markVoiceFailed(attempt.voice)
          const nextStep = attempts.findIndex(
            (a, i) => i > step && !(a.voice && onlineBroken && isOnline(a.voice)),
          )
          if (nextStep >= 0) tryAt(nextStep)
          else {
            debugLog(`${label} / 모든 방법 실패 → 자막만`)
            finish()
          }
        }
        currentUtterance = utterance
        debugLog(
          step === 0
            ? `${label} / ${how}`
            : `${label} / 다시 시도 ${step}: ${attempt.note} / ${how}`,
        )
        window.speechSynthesis.speak(utterance)
      } catch {
        // 목소리 설정에 실패해도 장면이 멈추지 않도록, 자막만 보여주고 글자 수만큼 기다린다
        window.clearTimeout(timer)
        timer = window.setTimeout(finish, fallbackMs)
      }
    }
    const start = () => tryAt(0)
    // 방금 읽던 목소리를 끊었다면 잠깐 기다렸다 읽는다 (첫 줄은 끊은 게 없으니 누른 순간 바로 읽는다)
    const sinceCancel = performance.now() - lastCancelAt
    if (sinceCancel < AFTER_CANCEL_MS) window.setTimeout(start, AFTER_CANCEL_MS - sinceCancel)
    else start()
  })
}

/** 읽고 있는 목소리·녹음 파일을 멈춘다. 읽는 중이 아니면 기기 목소리는 건드리지 않는다. */
export function stopSpeaking() {
  generation += 1
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  currentUtterance = null
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) {
    synth.cancel()
    lastCancelAt = performance.now()
  }
}

/**
 * 대사 녹음 파일 주소 규칙 (줄번호는 1부터)
 * - 역사 인물 대사: public/audio/장소id/줄번호.mp3
 * - 내 캐릭터 대사: public/audio/장소id/줄번호-boy.mp3, 줄번호-girl.mp3 (아바타 성별에 맞는 파일)
 */
export function dialogueAudioUrl(placeId: string, lineIndex: number, kid?: 'boy' | 'girl') {
  return `/audio/${placeId}/${lineIndex + 1}${kid ? `-${kid}` : ''}.mp3`
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}
