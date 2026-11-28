import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton } from './ActionButton'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'

// '카메라로 찍기': 컴퓨터와 휴대폰 모두 앱 화면 안에서 앞면 카메라 미리보기를 보여주고 한 장 찍는다.
// (휴대폰의 카메라 앱을 따로 열면 크롬이 메모리 부족으로 페이지를 다시 불러올 수 있어서 쓰지 않는다)
// - 미리보기는 거울처럼 좌우를 뒤집어 보여주고, 저장도 같은 모습으로 한다.
// - 찍으면 카메라를 바로 끄고 찍은 사진을 보여준다 → '다시 찍기' 또는 '사용하기'.
// - 카메라가 없거나 권한을 거절하면 안내와 '앨범에서 고르기'. 창을 닫거나 화면을 나가도 카메라를 끈다.
// 찍은 사진은 서버로 보내지 않고 onCapture로만 넘긴다.
export function WebcamCapture({
  onCapture,
  onUseAlbum,
  onClose,
}: {
  onCapture: (photo: Blob) => void
  onUseAlbum: () => void
  onClose: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  /** 이 창이 아직 열려 있는지 (닫힌 뒤에 늦게 켜진 카메라는 바로 끈다) */
  const alive = useRef(true)
  /** 화면이 가려져 카메라를 잠깐 꺼 둔 상태인지 */
  const paused = useRef(false)
  const [status, setStatus] = useState<'starting' | 'ready' | 'taken' | 'denied' | 'error'>('starting')
  /** 찍은 사진 (보여주기용 주소와 넘겨줄 원본) */
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }, [])

  const startCamera = useCallback(() => {
    setStatus('starting')
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      return () => {}
    }
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      .then((media) => {
        if (cancelled || !alive.current) return media.getTracks().forEach((track) => track.stop())
        stream.current = media
        if (video.current) {
          video.current.srcObject = media
          void video.current.play().catch(() => {})
        }
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled || !alive.current) return
        const name = error instanceof DOMException ? error.name : ''
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
      })
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [stopCamera])

  // 창이 열리면 카메라를 켜고, 닫히면(화면을 나가면) 끈다
  useEffect(() => {
    alive.current = true
    const stop = startCamera()
    return () => {
      alive.current = false
      stop()
    }
  }, [startCamera])
  // 다른 앱으로 나가는 등 화면이 가려지면 카메라를 꺼 두고, 돌아오면 다시 켠다 (찍은 뒤에는 그대로)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (stream.current) {
          stopCamera()
          paused.current = true
        }
      } else if (paused.current) {
        paused.current = false
        startCamera()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [startCamera, stopCamera])
  // 찍은 사진 주소는 바꾸거나 닫을 때 풀어 준다
  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url)
    }
  }, [shot])

  function shoot() {
    const source = video.current
    if (!source || !source.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = source.videoWidth
    canvas.height = source.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    // 미리보기처럼 좌우를 뒤집어 거울에 비친 모습 그대로 저장한다
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(source, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        // 찍었으면 카메라는 바로 끈다
        stopCamera()
        setShot({ blob, url: URL.createObjectURL(blob) })
        setStatus('taken')
      },
      'image/jpeg',
      0.9,
    )
  }

  function retake() {
    setShot(null)
    startCamera()
  }

  const trouble = status === 'denied' || status === 'error'
  return (
    <BottomSheet title="카메라로 찍기" onClose={onClose}>
      {trouble ? (
        <div className="webcam-error" role="alert">
          <Icon name="camera" size={28} />
          <p>
            {status === 'denied' ? (
              <>
                카메라 사용을 허락하지 않았어요.
                <br />
                주소창 옆 설정에서 카메라를 허락하면 다시 찍을 수 있어요.
              </>
            ) : (
              <>
                카메라를 쓸 수 없어요.
                <br />
                카메라가 없거나 다른 곳에서 쓰고 있어요.
              </>
            )}
            <br />
            앨범에서 사진을 골라도 돼요.
          </p>
          <ActionButton onClick={onUseAlbum}>앨범에서 고르기</ActionButton>
        </div>
      ) : (
        <>
          <div className="webcam-frame">
            {/* 찍은 뒤에는 카메라가 꺼져 있고, 찍은 사진이 그 자리에 보인다 */}
            <video ref={video} playsInline muted aria-label="카메라 화면" hidden={status === 'taken'} />
            {shot && <img src={shot.url} alt="찍은 사진" />}
            <i aria-hidden="true" />
            {status === 'starting' && <span className="webcam-wait">카메라를 켜는 중이에요…</span>}
          </div>
          <p className="face-guide">
            {status === 'taken'
              ? '이 사진으로 할까요?'
              : '정면을 바라보고 얼굴이 화면 가운데 오게 찍어 주세요.'}
          </p>
          {status === 'taken' && shot ? (
            <div className="webcam-actions">
              <ActionButton variant="secondary" onClick={retake}>
                <Icon name="refresh" size={18} /> 다시 찍기
              </ActionButton>
              <ActionButton onClick={() => onCapture(shot.blob)}>
                <Icon name="check" size={18} /> 사용하기
              </ActionButton>
            </div>
          ) : (
            <ActionButton onClick={shoot} disabled={status !== 'ready'}>
              <Icon name="camera" size={18} /> 찍기
            </ActionButton>
          )}
        </>
      )}
    </BottomSheet>
  )
}
