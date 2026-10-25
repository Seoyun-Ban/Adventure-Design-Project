import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Avatar } from './Avatar'
import { Place3D } from './Place3D'
import { figures, myVoice } from '../data/figures'
import { Bgm } from '../lib/bgm'
import { canSpeak, speak, stopSpeaking } from '../lib/speech'
import type { AvatarLook, Equipped } from '../types'

// 학습 중간에 나오는 영상 장면
// 장소에 맞는 3D 배경 위에서 역사 인물과 내 아바타(등록한 얼굴)가 함께 대화한다.
// 대사는 인물에 맞는 목소리로 읽고, 장소 분위기에 맞는 배경 음악이 깔린다.
export function HistoryScene({
  placeId,
  placeName,
  nickname,
  look,
  equipped,
  faceImage,
}: {
  placeId: string
  placeName: string
  nickname: string
  look: AvatarLook
  equipped: Equipped
  faceImage?: string
}) {
  const figure = figures[placeId]
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(true)
  const runId = useRef(0)
  const bgm = useRef(new Bgm())
  const soundRef = useRef(sound)
  soundRef.current = sound

  useEffect(() => {
    const music = bgm.current
    return () => {
      runId.current += 1
      stopSpeaking()
      music.stop()
    }
  }, [])

  if (!figure) return null
  const line = index >= 0 ? figure.dialogue[index] : null

  async function play() {
    const id = ++runId.current
    setPlaying(true)
    if (soundRef.current) bgm.current.start(figure.mood)
    for (let i = 0; i < figure.dialogue.length; i += 1) {
      if (runId.current !== id) return
      setIndex(i)
      const current = figure.dialogue[i]
      await speak(current.text, current.speaker === 'figure' ? figure.voice : myVoice, soundRef.current)
      await new Promise((resolve) => window.setTimeout(resolve, 350))
    }
    if (runId.current !== id) return
    setPlaying(false)
    bgm.current.stop()
  }

  function stop() {
    runId.current += 1
    stopSpeaking()
    bgm.current.stop()
    setPlaying(false)
  }

  function toggleSound() {
    const next = !sound
    setSound(next)
    soundRef.current = next
    if (!next) {
      stopSpeaking()
      bgm.current.stop()
    } else if (playing) {
      bgm.current.start(figure.mood)
    }
  }

  return (
    <figure className={`history-scene ${playing ? 'playing' : ''}`}>
      <div className="scene-stage">
        <Place3D placeId={placeId} className="scene-3d" speed={0.12} />
        <div className={`scene-actor figure ${line?.speaker === 'figure' ? 'speaking' : ''}`}>
          <Avatar
            look={figure.look}
            equipped={figure.equipped}
            beard={figure.beard}
            talking={playing && line?.speaker === 'figure'}
            label={figure.name}
          />
          <span className="actor-name">{figure.name}</span>
        </div>
        <div className={`scene-actor me ${line?.speaker === 'me' ? 'speaking' : ''}`}>
          <Avatar
            look={look}
            equipped={equipped}
            faceImage={faceImage}
            talking={playing && line?.speaker === 'me'}
            label={`${nickname}의 아바타`}
          />
          <span className="actor-name">{nickname}</span>
        </div>
        {line && (
          <p className={`scene-bubble ${line.speaker}`} key={index}>
            {line.text}
          </p>
        )}
        {!playing && (
          <button
            type="button"
            className="scene-play"
            onClick={play}
            aria-label={index >= 0 ? '장면 다시 보기' : '장면 재생'}
          >
            <span>
              <Icon name={index >= 0 ? 'refresh' : 'play'} size={30} />
            </span>
            <small>{index >= 0 ? '다시 보기' : `${figure.name}와 만나기`}</small>
          </button>
        )}
        <div className="scene-controls">
          {playing && (
            <button type="button" onClick={stop} aria-label="멈춤">
              <Icon name="close" size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={sound ? '소리 끄기' : '소리 켜기'}
            className={sound ? '' : 'muted'}
          >
            <Icon name="bell" size={15} />
          </button>
        </div>
      </div>
      <figcaption>
        {figure.title} · {placeName} 3D 장면
        {sound && !canSpeak() ? ' · 이 기기에는 한국어 음성이 없어 자막으로 보여요' : ''}
      </figcaption>
    </figure>
  )
}
