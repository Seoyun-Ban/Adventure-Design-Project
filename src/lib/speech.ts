// 영상 장면 대사 읽기
// 1) 녹음 파일(mp3)이 있으면 그 파일을 먼저 재생한다.  예: public/audio/gyeongbokgung/1.mp3
//    있는 파일 목록은 npm run dev/build 때 scripts/list-audio.mjs가 만든다 (없는 파일은 서버에 요청하지 않는다).
// 2) 없으면 브라우저 내장 음성(Web Speech API)으로 읽는다. 기기에 있는 한국어 목소리 중 남성/여성을 골라 쓴다.
// 3) 목소리 목록을 아직 못 받았으면 목소리를 고르지 않고 lang만 'ko-KR'로 정해 기본 목소리로 읽는다.
// 4) 음성 기능 자체가 없는 브라우저면 소리 없이 글자 수만큼 기다린다 (자막만 보인다).
import { AUDIO_FILES } from '../data/generated/audioFiles'

/** 대사 목소리: 남성/여성 + 높낮이·빠르기 (1이 기본) */
export type VoiceSpec = { gender: 'male' | 'female'; pitch: number; rate: number }

// 한국어 목소리 이름으로 성별을 구분한다. 앞에 적은 것일수록 먼저 고른다.
// (엣지: Microsoft InJoon·SunHi 등, 크롬: Google 한국의, 애플: Yuna·Minsu 등)
const PREFERRED: Record<VoiceSpec['gender'], string[]> = {
  male: ['injoon', 'hyunsu', 'bongjin', 'gookmin', 'minsu', 'jinho'],
  female: ['sunhi', 'jimin', 'seohyeon', 'yujin', 'soonbok', 'heami', 'yuna', 'sora', 'google'],
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

function koreanVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('ko'))
}

function genderOf(voice: SpeechSynthesisVoice): VoiceSpec['gender'] | null {
  const name = voice.name.toLowerCase()
  for (const gender of ['male', 'female'] as const) {
    if (PREFERRED[gender].some((key) => name.includes(key))) return gender
  }
  if (GENDER_WORDS.female.test(voice.name)) return 'female'
  if (GENDER_WORDS.male.test(voice.name)) return 'male'
  return null
}

/** 성별마다 가장 알맞은 한국어 목소리 (자연스러운 'Online (Natural)' 목소리를 우선) */
function pickVoices() {
  if (cache) return cache
  const voices = koreanVoices()
  if (voices.length === 0) return { male: null, female: null, any: null }
  const best = (gender: VoiceSpec['gender']) => {
    const candidates = voices.filter((voice) => genderOf(voice) === gender)
    const rank = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase()
      const order = PREFERRED[gender].findIndex((key) => name.includes(key))
      return (order < 0 ? 50 : order) - (name.includes('natural') ? 0.5 : 0)
    }
    return candidates.sort((a, b) => rank(a) - rank(b))[0] ?? null
  }
  cache = { male: best('male'), female: best('female'), any: voices[0] }
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
      const korean = koreanVoices()
      debugLog(
        `목소리 목록 ${synth.getVoices().length}개 (한국어 ${korean.length}개)` +
          (korean.length ? `: ${korean.map((voice) => voice.name).join(', ')}` : ' → 기본 목소리(ko-KR)로 읽음'),
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
  return window.speechSynthesis.getVoices().length === 0 || pickVoices().any !== null
}

/** 이 목소리로 읽을 때 실제로 쓸 기기 목소리와 높낮이 (디버깅·확인용으로도 쓴다) */
export function resolveVoice(spec: VoiceSpec) {
  const voices = pickVoices()
  const exact = voices[spec.gender]
  const voice = exact ?? voices.male ?? voices.female ?? voices.any
  const substitute = !exact
  return {
    voice,
    substitute,
    pitch: clamp(spec.pitch, substitute ? SUBSTITUTE_PITCH : PITCH),
    rate: clamp(spec.rate, [0.8, 1.15]),
  }
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
  if (audioUrl && RECORDINGS.has(audioUrl)) {
    debugLog(`${label} / 녹음 파일 ${audioUrl}`)
    if (await playRecording(audioUrl)) return
    if (started !== generation) return
  }
  if (!hasSynth()) {
    debugLog(`${label} / 음성 기능 없는 브라우저 (자막만)`)
    return wait(fallbackMs)
  }
  // 목소리 목록을 아직 못 받았으면 voice는 null → 목소리를 고르지 않고 ko-KR 기본 목소리로 읽는다
  const { voice, pitch, rate } = resolveVoice(spec)
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    // 일부 브라우저에서 onend가 오지 않는 경우 대비
    window.setTimeout(finish, fallbackMs + 4000)
    const start = () => {
      // 기다리는 사이에 다음 줄로 넘어갔거나 멈췄으면 이 줄은 읽지 않는다
      if (started !== generation) return finish()
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        if (voice) utterance.voice = voice
        utterance.lang = voice?.lang ?? 'ko-KR'
        utterance.pitch = pitch
        utterance.rate = rate
        utterance.onend = () => {
          if (currentUtterance === utterance) currentUtterance = null
          finish()
        }
        utterance.onerror = (event) => {
          // 다음 줄로 넘기며 끊은 것(interrupted·canceled)은 정상
          if (event.error !== 'interrupted' && event.error !== 'canceled') debugLog(`목소리 오류: ${event.error}`)
          finish()
        }
        currentUtterance = utterance
        debugLog(`${label} / ${voice ? voice.name : '기본 목소리(ko-KR, 목록을 아직 못 받음)'}`)
        window.speechSynthesis.speak(utterance)
      } catch {
        // 목소리 설정에 실패해도 장면이 멈추지 않도록, 자막만 보여주고 글자 수만큼 기다린다
        window.setTimeout(finish, fallbackMs)
      }
    }
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

/** 대사 녹음 파일 주소 규칙: public/audio/장소id/줄번호.mp3 (줄번호는 1부터) */
export function dialogueAudioUrl(placeId: string, lineIndex: number) {
  return `/audio/${placeId}/${lineIndex + 1}.mp3`
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}
