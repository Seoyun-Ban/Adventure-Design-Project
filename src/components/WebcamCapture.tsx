import { useEffect, useRef, useState } from 'react'
import { ActionButton } from './ActionButton'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'

// 컴퓨터에서 '카메라로 찍기': 웹캠 화면을 보여주고 찍기 버튼으로 한 장 찍는다.
// 웹캠이 없거나 권한을 거절하면 앨범에서 고르기로 안내한다. 창을 닫으면 카메라를 끈다.
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
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting')

  useEffect(() => {
    let stream: MediaStream | undefined
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      return
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      .then((media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop())
        stream = media
        if (video.current) {
          video.current.srcObject = media
          void video.current.play()
        }
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

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
    canvas.toBlob((blob) => blob && onCapture(blob), 'image/jpeg', 0.9)
  }

  return (
    <BottomSheet title="카메라로 찍기" onClose={onClose}>
      {status === 'error' ? (
        <div className="webcam-error" role="alert">
          <Icon name="camera" size={28} />
          <p>
            카메라를 쓸 수 없어요.
            <br />
            카메라가 없거나, 카메라 사용을 허락하지 않았어요.
            <br />
            앨범에서 사진을 골라 주세요.
          </p>
          <ActionButton onClick={onUseAlbum}>앨범에서 고르기</ActionButton>
        </div>
      ) : (
        <>
          <div className="webcam-frame">
            <video ref={video} playsInline muted aria-label="웹캠 화면" />
            <i aria-hidden="true" />
            {status === 'starting' && <span className="webcam-wait">카메라를 켜는 중이에요…</span>}
          </div>
          <p className="face-guide">얼굴이 동그라미 안에 들어오게 하고 찍어 주세요.</p>
          <ActionButton onClick={shoot} disabled={status !== 'ready'}>
            <Icon name="camera" size={18} /> 찍기
          </ActionButton>
        </>
      )}
    </BottomSheet>
  )
}
