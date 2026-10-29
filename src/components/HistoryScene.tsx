import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Avatar } from './Avatar'
import { figures, myVoiceFor } from '../data/figures'
import { characterFor } from '../data/avatar'
import {
  canSpeak,
  dialogueAudioUrl,
  prepareVoices,
  resetFailedVoices,
  speak,
  stopSpeaking,
} from '../lib/speech'
import { withJosa } from '../lib/korean'
import type { AvatarLook, Equipped } from '../types'

// 학습 중간에 나오는 영상 장면
// 장소 배경 그림(public/images/backgrounds/bg-장소id.webp) 위에서 역사 인물과 내 캐릭터(등록한 얼굴)가 함께 대화한다.
// 배경은 천천히 조금씩 확대되고, 인물과 내 캐릭터는 배경 아래쪽 빈 땅에 선다.
// 대사는 화면을 누를 때마다 다음 줄로 넘어가고, 마지막 줄 다음에 누르면 '다시 보기'가 나온다.
// 대사는 녹음 파일(public/audio/장소id/줄번호.mp3)이 있으면 그것을, 없으면 인물에 맞는 남성/여성 기기 목소리로 읽는다.
// 읽는 도중에 누르면 읽던 목소리를 멈추고 다음 줄을 읽는다. 소리 버튼은 대사 목소리만 켜고 끈다.
// 브라우저는 사용자가 누른 순간에만 소리를 낼 수 있어서, 첫 대사는 '만나기'를 누른 순간 바로 읽기 시작한다.
// '전체 화면'을 누르면 장면이 화면 전체를 채운다. 전체 화면 기능이 없는 기기(아이폰 사파리 등)는
// 화면을 꽉 채우는 덮개 방식으로 대신한다.
// 캐릭터는 그림(PNG)이 있으면 그림으로, 아직 없으면 SVG 캐릭터로 보여준다. 내 캐릭터는 지금 입은 옷 그림으로 나온다.
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
  /** 장면이 진행 중인지 (처음 '만나기'를 누른 뒤부터 마지막 대사 다음을 누를 때까지) */
  const [playing, setPlaying] = useState(false)
  /** 지금 줄을 읽고 있는지 (말하는 캐릭터가 살짝 움직인다) */
  const [speaking, setSpeaking] = useState(false)
  const [sound, setSound] = useState(true)
  const runId = useRef(0)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const stageRef = useRef<HTMLDivElement>(null)
  /** native: 브라우저 전체 화면, overlay: 화면을 덮는 방식 */
  const [full, setFull] = useState<'off' | 'native' | 'overlay'>('off')

  // 사용자가 Esc 등으로 브라우저 전체 화면을 빠져나오면 상태도 되돌린다
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFull((mode) => (mode === 'native' ? 'off' : mode))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // 덮개 방식일 때: 뒤 화면이 스크롤되지 않게 하고, Esc로 닫는다
  useEffect(() => {
    if (full !== 'overlay') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && setFull('off')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [full])

  // 목소리 목록을 미리 불러 둔다 ('만나기'를 누른 순간 기다리지 않고 바로 읽기 위해)
  useEffect(() => {
    void prepareVoices()
  }, [])

  useEffect(() => {
    return () => {
      runId.current += 1
      stopSpeaking()
      resetFailedVoices()
    }
  }, [])

  if (!figure) return null
  const total = figure.dialogue.length
  const line = index >= 0 ? figure.dialogue[index] : null
  // 옷을 입었고 그 옷 그림이 있으면 옷 입은 그림으로 나온다
  const me = characterFor(look, equipped)
  const figureTalking = speaking && line?.speaker === 'figure'
  const meTalking = speaking && line?.speaker === 'me'

  /** i번째 대사를 보여주고 읽는다. 읽던 목소리가 있으면 멈추고 새로 읽는다. */
  function say(i: number) {
    const id = ++runId.current
    stopSpeaking()
    setIndex(i)
    setSpeaking(true)
    const current = figure.dialogue[i]
    const voice = current.speaker === 'figure' ? figure.voice : myVoiceFor(look.gender)
    const who = current.speaker === 'figure' ? figure.name : nickname
    // 내 캐릭터 대사는 아바타 성별에 맞는 녹음 파일(줄번호-boy / 줄번호-girl)
    const kid = current.speaker === 'me' ? (look.gender === '남' ? 'boy' : 'girl') : undefined
    void speak(
      current.text,
      voice,
      soundRef.current,
      dialogueAudioUrl(placeId, i, kid),
      `대사 ${i + 1}/${total} 읽기 시작: ${who}`,
    ).then(() => {
      if (runId.current === id) setSpeaking(false)
    })
  }

  /** '만나기'·'다시 보기'를 누른 순간 첫 대사를 바로 읽는다 */
  function start() {
    setPlaying(true)
    say(0)
  }

  /** 화면을 누르면 다음 대사로. 마지막 대사 다음에 누르면 장면을 마친다. */
  function next() {
    if (!playing) return
    if (index + 1 < total) say(index + 1)
    else finish()
  }

  function finish() {
    runId.current += 1
    stopSpeaking()
    // 장면이 끝났으니 이번 장면에서 실패한 목소리도 다음에는 다시 써 본다
    resetFailedVoices()
    setPlaying(false)
    setSpeaking(false)
  }

  function onStageKey(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }

  async function enterFullscreen() {
    const stage = stageRef.current
    if (stage && document.fullscreenEnabled && stage.requestFullscreen) {
      try {
        await stage.requestFullscreen()
        setFull('native')
        return
      } catch {
        // 막혀 있으면 아래 덮개 방식으로
      }
    }
    setFull('overlay')
  }

  function exitFullscreen() {
    if (full === 'native' && document.fullscreenElement) void document.exitFullscreen()
    setFull('off')
  }

  /** 소리 버튼: 대사 목소리만 켜고 끈다. 켜면 지금 보고 있는 대사부터 다시 읽는다. */
  function toggleSound() {
    const on = !sound
    setSound(on)
    soundRef.current = on
    if (!on) {
      runId.current += 1
      stopSpeaking()
      setSpeaking(false)
    } else if (playing && index >= 0) {
      say(index)
    }
  }

  return (
    <figure className={`history-scene ${playing ? 'playing' : ''}`}>
      <div
        ref={stageRef}
        className={`scene-stage ${full !== 'off' ? 'is-full' : ''} ${full === 'overlay' ? 'is-overlay' : ''}`}
        role={full !== 'off' ? 'dialog' : undefined}
        aria-label={full !== 'off' ? `${figure.name} 영상 장면 전체 화면` : undefined}
        tabIndex={playing ? 0 : undefined}
        onClick={next}
        onKeyDown={onStageKey}
      >
        <div
          className="scene-bg"
          style={{ backgroundImage: `url(/images/backgrounds/bg-${placeId}.webp)` }}
          aria-hidden="true"
        />
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
          <p className={`scene-bubble ${line.speaker}`} key={index} aria-live="polite">
            {line.text}
            {playing && (
              <small className="scene-tap">
                {index + 1}/{total} · {index + 1 < total ? '누르면 다음' : '누르면 끝'}
              </small>
            )}
          </p>
        )}
        {!playing && (
          <button
            type="button"
            className="scene-play"
            onClick={(event) => {
              event.stopPropagation()
              start()
            }}
            aria-label={index >= 0 ? '장면 다시 보기' : '장면 시작'}
          >
            <span>
              <Icon name={index >= 0 ? 'refresh' : 'play'} size={30} />
            </span>
            <small>{index >= 0 ? '다시 보기' : `${withJosa(figure.name, '과')} 만나기`}</small>
          </button>
        )}
        {full !== 'off' && (
          <button
            type="button"
            className="scene-full-close"
            onClick={(event) => {
              event.stopPropagation()
              exitFullscreen()
            }}
            aria-label="전체 화면 닫기"
          >
            <Icon name="close" size={18} /> 닫기
          </button>
        )}
        {/* 아래 버튼들을 누를 때는 대사가 넘어가지 않게 한다 */}
        <div className="scene-controls" onClick={(event) => event.stopPropagation()}>
          {playing && (
            <button type="button" onClick={finish} aria-label="장면 끝내기">
              <Icon name="stop" size={15} />
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
          {full === 'off' && (
            <button type="button" onClick={enterFullscreen} aria-label="전체 화면">
              <Icon name="expand" size={15} />
            </button>
          )}
        </div>
      </div>
      <figcaption>
        {figure.title} · {placeName}
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
