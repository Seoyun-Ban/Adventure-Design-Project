// 브라우저 내장 음성 읽기(Web Speech API)로 대사를 읽는다.
// 한국어 음성이 없는 기기에서는 조용히 넘어가고 자막만 보여준다.

let koreanVoice: SpeechSynthesisVoice | null | undefined

function pickVoice() {
  if (koreanVoice !== undefined || !('speechSynthesis' in window)) return koreanVoice ?? null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  koreanVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('ko')) ?? null
  return koreanVoice
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    koreanVoice = undefined
    pickVoice()
  }
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && pickVoice() !== null
}

/** 대사를 읽고, 다 읽으면 끝나는 Promise. 음성이 없으면 글자 수에 맞춰 기다린다 */
export function speak(text: string, voice: { pitch: number; rate: number }, enabled: boolean): Promise<void> {
  const fallbackMs = 1400 + text.length * 95
  return new Promise((resolve) => {
    const selected = enabled ? pickVoice() : null
    if (!selected) {
      window.setTimeout(resolve, fallbackMs)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = selected
    utterance.lang = selected.lang
    utterance.pitch = voice.pitch
    utterance.rate = voice.rate
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    utterance.onend = finish
    utterance.onerror = finish
    // 일부 브라우저에서 onend가 오지 않는 경우 대비
    window.setTimeout(finish, fallbackMs + 4000)
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
