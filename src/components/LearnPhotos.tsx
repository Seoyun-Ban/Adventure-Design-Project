import { useEffect, useState } from 'react'
import { PLACE_PHOTOS, type PlacePhoto } from '../data/generated/photos'

/** 장소의 사진 목록 (없으면 빈 목록 → 글만 나온다) */
export function photosOf(placeId: string): PlacePhoto[] {
  return PLACE_PHOTOS[placeId] ?? []
}

/**
 * 사진 n장을 글 사이 자리 slotCount곳에 고르게 나눈다. 반환값: 자리 번호별 사진 목록
 * (자리 0 = 첫 문단 다음, 자리 1~ = 자세히 읽기 문단 다음)
 */
export function spreadPhotos(photos: PlacePhoto[], slotCount: number): PlacePhoto[][] {
  const slots: PlacePhoto[][] = Array.from({ length: slotCount }, () => [])
  // 사진이 1장뿐이면 맨 끝이 아니라 첫 문단 뒤에 둔다
  if (photos.length === 1) {
    slots[0].push(photos[0])
    return slots
  }
  photos.forEach((photo, index) => {
    const slot = Math.min(slotCount - 1, Math.floor(((index + 0.5) * slotCount) / photos.length))
    slots[slot].push(photo)
  })
  return slots
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

/** 사진 크게 보기 (바깥을 누르거나 닫기 버튼, Esc로 닫는다) */
export function PhotoViewer({ photo, onClose }: { photo: PlacePhoto; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label="사진 크게 보기" onClick={onClose}>
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
