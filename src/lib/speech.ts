// 영상 장면 대사 읽기
// 1) 녹음 파일(mp3)이 있으면 그 파일을 먼저 재생한다.  예: public/audio/gyeongbokgung/1.mp3
// 2) 없으면 브라우저 내장 음성(Web Speech API)으로 읽는다. 기기에 있는 한국어 목소리 중 남성/여성을 골라 쓴다.
// 3) 한국어 목소리도 없으면 소리 없이 글자 수만큼 기다린다 (자막만 보인다).

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

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // 목소리 목록은 늦게 도착할 수 있어서, 바뀌면 다시 고른다
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cache = null
  })
}

const clamp = (value: number, [min, max]: [number, number]) => Math.min(max, Math.max(min, value))

/** 한국어 목소리가 하나라도 있는지 */
export function canSpeak() {
  return pickVoices().any !== null
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
/** 없다고 확인된 녹음 파일 (같은 파일을 다시 찾지 않는다) */
const missingAudio = new Set<string>()

/** 녹음 파일 재생. 끝까지 재생하면 true, 파일이 없거나 재생할 수 없으면 false */
function playRecording(url: string): Promise<boolean> {
  if (missingAudio.has(url)) return Promise.resolve(false)
  return new Promise((resolve) => {
    const audio = new Audio(url)
    currentAudio = audio
    let settled = false
    const done = (played: boolean) => {
      if (settled) return
      settled = true
      if (!played) missingAudio.add(url)
      if (currentAudio === audio) currentAudio = null
      resolve(played)
    }
    audio.onended = () => done(true)
    audio.onerror = () => done(false)
    audio.play().catch(() => done(false))
  })
}

// ---------- 대사 읽기 ----------

/**
 * 대사 한 줄을 읽고, 다 읽으면 끝나는 Promise
 * - audioUrl의 녹음 파일이 있으면 그것을 재생하고, 없으면 기기 목소리로 읽는다
 * - enabled가 false(소리 끔)거나 한국어 목소리가 없으면 글자 수에 맞춰 기다리기만 한다
 */
export async function speak(
  text: string,
  spec: VoiceSpec,
  enabled: boolean,
  audioUrl?: string,
): Promise<void> {
  const fallbackMs = 1400 + text.length * 95
  if (!enabled) return wait(fallbackMs)
  if (audioUrl && (await playRecording(audioUrl))) return
  const { voice, pitch, rate } = resolveVoice(spec)
  if (!voice) return wait(fallbackMs)
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    // 일부 브라우저에서 onend가 오지 않는 경우 대비
    window.setTimeout(finish, fallbackMs + 4000)
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.lang = voice.lang
      utterance.pitch = pitch
      utterance.rate = rate
      utterance.onend = finish
      utterance.onerror = finish
      window.speechSynthesis.speak(utterance)
    } catch {
      // 목소리 설정에 실패해도 장면이 멈추지 않도록, 자막만 보여주고 글자 수만큼 기다린다
      window.setTimeout(finish, fallbackMs)
    }
  })
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** 대사 녹음 파일 주소 규칙: public/audio/장소id/줄번호.mp3 (줄번호는 1부터) */
export function dialogueAudioUrl(placeId: string, lineIndex: number) {
  return `/audio/${placeId}/${lineIndex + 1}.mp3`
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}
