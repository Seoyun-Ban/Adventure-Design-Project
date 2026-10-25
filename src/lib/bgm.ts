// 배경 음악: 음원 파일 없이 Web Audio로 국악 5음 음계(궁·상·각·치·우)를 연주한다.
// 가야금처럼 튕기는 소리 + 낮게 깔리는 지속음. 장소 분위기에 따라 빠르기와 음높이가 다르다.

type Mood = 'court' | 'temple' | 'sea' | 'memorial'

const settings: Record<Mood, { root: number; tempo: number; scale: number[]; drone: number }> = {
  court: { root: 293.66, tempo: 0.62, scale: [0, 2, 5, 7, 9, 12], drone: 0.5 },
  temple: { root: 261.63, tempo: 0.9, scale: [0, 2, 5, 7, 9, 12], drone: 0.5 },
  sea: { root: 220, tempo: 0.42, scale: [0, 3, 5, 7, 10, 12], drone: 0.5 },
  memorial: { root: 246.94, tempo: 0.75, scale: [0, 3, 5, 7, 10, 12], drone: 0.5 },
}

export class Bgm {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private timer = 0
  private droneOsc: OscillatorNode | null = null

  start(mood: Mood) {
    this.stop()
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const context = new AudioCtx()
    const master = context.createGain()
    master.gain.value = 0
    master.gain.linearRampToValueAtTime(0.16, context.currentTime + 1.5)
    master.connect(context.destination)
    this.context = context
    this.master = master

    const { root, tempo, scale, drone } = settings[mood]
    // 지속음 (해금·대금처럼 낮게 깔리는 소리)
    const droneOsc = context.createOscillator()
    const droneGain = context.createGain()
    droneOsc.type = 'sine'
    droneOsc.frequency.value = root * drone
    droneGain.gain.value = 0.25
    droneOsc.connect(droneGain).connect(master)
    droneOsc.start()
    this.droneOsc = droneOsc

    let step = 0
    let last = 2
    const play = () => {
      if (!this.context || !this.master) return
      // 직전 음 근처로 움직이는 느린 선율
      last = Math.max(
        0,
        Math.min(scale.length - 1, last + [-1, 0, 1, 1, -1, 2, -2][Math.floor(Math.random() * 7)]),
      )
      if (step % 8 !== 7) this.pluck(root * 2 ** (scale[last] / 12), step % 4 === 0 ? 0.5 : 0.32)
      if (step % 4 === 0) this.pluck((root / 2) * 2 ** (scale[0] / 12), 0.35)
      step += 1
      this.timer = window.setTimeout(play, tempo * 1000 * (step % 8 === 0 ? 1.5 : 1))
    }
    play()
  }

  /** 가야금처럼 튕기는 소리 */
  private pluck(frequency: number, volume: number) {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    const filter = this.context.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency * 1.01, now)
    osc.frequency.exponentialRampToValueAtTime(frequency, now + 0.12)
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    osc.connect(filter).connect(gain).connect(this.master)
    osc.start(now)
    osc.stop(now + 1.7)
  }

  stop() {
    window.clearTimeout(this.timer)
    const context = this.context
    const drone = this.droneOsc
    if (context && this.master) {
      this.master.gain.linearRampToValueAtTime(0, context.currentTime + 0.6)
      window.setTimeout(() => {
        drone?.stop()
        context.close()
      }, 700)
    }
    this.context = null
    this.master = null
    this.droneOsc = null
  }
}
