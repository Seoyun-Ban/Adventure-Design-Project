import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { PLACE_PHOTOS, type PlacePhoto } from '../data/generated/photos'

/** 장소의 사진 목록 (없으면 빈 목록 → 글만 나온다) */
export function photosOf(placeId: string): PlacePhoto[] {
  return PLACE_PHOTOS[placeId] ?? []
}

/** 출처 글씨 + 원본 페이지 링크 (링크를 눌러도 크게 보기가 열리거나 닫히지 않게 한다) */
function Credit({ photo }: { photo: PlacePhoto }) {
  return (
    <small>
      출처: {photo.credit}
      {photo.url && (
        <>
          {' · '}
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            원본 페이지
          </a>
        </>
      )}
    </small>
  )
}

/** 사진 + 설명 + 작은 글씨 출처. 누르면 크게 본다 */
export function PhotoFigure({ photo, onOpen }: { photo: PlacePhoto; onOpen: (photo: PlacePhoto) => void }) {
  return (
    <figure className={`learn-photo${photo.locked ? ' learn-photo-locked' : ''}`}>
      <button type="button" onClick={() => onOpen(photo)} aria-label={`${photo.caption} 크게 보기`}>
        <img
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          style={!photo.locked && photo.crop ? { objectPosition: photo.crop } : undefined}
        />
      </button>
      <figcaption>
        {photo.caption}
        <Credit photo={photo} />
      </figcaption>
    </figure>
  )
}

/**
 * 한 자리의 사진 묶음. 1장이면 그냥 사진, 2장 이상이면 옆으로 밀어서 넘기는 묶음
 * (아래에 '1/2' 표시, 컴퓨터에서는 좌우 화살표. 사진마다 설명·출처가 같이 넘어간다)
 * 화살표·표시는 사진 아래 줄에 두어 사진 위에는 아무것도 겹치지 않는다.
 */
export function PhotoGroup({
  photos,
  onOpen,
}: {
  photos: PlacePhoto[]
  onOpen: (photo: PlacePhoto) => void
}) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  if (photos.length === 0) return null
  if (photos.length === 1) return <PhotoFigure photo={photos[0]} onOpen={onOpen} />

  function goTo(next: number) {
    const el = track.current
    if (!el) return
    const target = Math.max(0, Math.min(photos.length - 1, next))
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
    setIndex(target)
  }
  function onScroll() {
    const el = track.current
    if (!el || el.clientWidth === 0) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(index + 1)
    }
  }

  return (
    <div className="photo-group" role="group" aria-roledescription="사진 묶음" aria-label="사진 넘겨 보기">
      <div className="photo-track" ref={track} onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={0}>
        {photos.map((photo) => (
          <PhotoFigure key={photo.src} photo={photo} onOpen={onOpen} />
        ))}
      </div>
      <div className="photo-nav">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="이전 사진">
          ‹
        </button>
        <span aria-live="polite">
          {index + 1}/{photos.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === photos.length - 1}
          aria-label="다음 사진"
        >
          ›
        </button>
      </div>
    </div>
  )
}

/** 사진 크게 보기 (바깥을 누르거나 닫기 버튼, Esc로 닫는다) */
export function PhotoViewer({ photo, onClose }: { photo: PlacePhoto; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      className="photo-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      onClick={onClose}
    >
      <button type="button" className="photo-viewer-close" onClick={onClose} aria-label="닫기">
        ×
      </button>
      <img src={photo.src} alt={photo.caption} />
      <p>
        {photo.caption}
        <Credit photo={photo} />
      </p>
    </div>
  )
}

export function usePhotoViewer() {
  return useState<PlacePhoto | null>(null)
}
