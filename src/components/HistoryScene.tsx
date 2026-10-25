import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Avatar } from './Avatar'
import { Place3D } from './Place3D'
import { figures, myCharacters, myVoice } from '../data/figures'
import { Bgm } from '../lib/bgm'
import { canSpeak, speak, stopSpeaking } from '../lib/speech'
import { withJosa } from '../lib/korean'
import type { AvatarLook, Equipped } from '../types'

// 학습 중간에 나오는 영상 장면
// 장소에 맞는 3D 배경 위에서 역사 인물과 내 캐릭터(등록한 얼굴)가 함께 대화한다.
// 대사는 인물에 맞는 목소리로 읽고, 장소 분위기에 맞는 배경 음악이 깔린다.
// 캐릭터는 그림(PNG)이 있으면 그림으로, 아직 없으면 SVG 캐릭터로 보여준다.
// 등록한 얼굴 사진은 앱에서 이 장면에서만 쓴다.
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
  const me = myCharacters[look.gender]
  const figureTalking = playing && line?.speaker === 'figure'
  const meTalking = playing && line?.speaker === 'me'

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
        <div
          className={`scene-actor figure ${line?.speaker === 'figure' ? 'speaking' : ''} ${figureTalking ? 'talking' : ''}`}
        >
          <CharacterArt
            key={figure.image}
            src={figure.image}
            label={figure.name}
            fallback={
              <Avatar
                look={figure.look}
                equipped={figure.equipped}
                beard={figure.beard}
                talking={figureTalking}
                label={figure.name}
              />
            }
          />
          <span className="actor-name">{figure.name}</span>
        </div>
        <div
          className={`scene-actor me ${line?.speaker === 'me' ? 'speaking' : ''} ${meTalking ? 'talking' : ''}`}
        >
          <CharacterArt
            key={me.image}
            src={me.image}
            label={`${nickname}의 캐릭터`}
            fallback={
              <Avatar
                look={look}
                equipped={equipped}
                faceImage={faceImage}
                talking={meTalking}
                label={`${nickname}의 캐릭터`}
              />
            }
          >
            {faceImage && (
              <img
                className="actor-face"
                src={faceImage}
                alt=""
                style={{ left: `${me.face.x}%`, top: `${me.face.y}%`, width: `${me.face.size}%` }}
              />
            )}
          </CharacterArt>
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
            <small>{index >= 0 ? '다시 보기' : `${withJosa(figure.name, '과')} 만나기`}</small>
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

/** 그림 파일을 불러오면 그림으로, 파일이 없어 불러오지 못하면 fallback(SVG 캐릭터)으로 보여준다. */
function CharacterArt({
  src,
  label,
  fallback,
  children,
}: {
  src?: string
  label: string
  fallback: ReactNode
  /** 그림 위에 겹칠 것 (예: 얼굴 사진) */
  children?: ReactNode
}) {
  const [missing, setMissing] = useState(false)
  if (!src || missing) return fallback
  return (
    <div className="actor-art">
      <img src={src} alt={label} onError={() => setMissing(true)} />
      {children}
    </div>
  )
}
