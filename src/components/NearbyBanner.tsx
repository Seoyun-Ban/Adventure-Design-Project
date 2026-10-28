import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { withJosa } from '../lib/korean'
import type { Place } from '../types'

/** 알림이 저절로 사라지기까지 (ms) */
const SHOW_MS = 9000

// 장소 반경 안에 들어와 그 장소가 열렸을 때 화면 위에 잠깐 뜨는 알림 (앱을 켜 둔 동안, 설정의 알림이 켜져 있을 때)
export function NearbyBanner({
  place,
  onOpen,
  onClose,
}: {
  place: Place
  onOpen: () => void
  onClose: () => void
}) {
  // 위치가 바뀌어 화면이 다시 그려져도 처음 뜬 때부터 시간을 센다
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="nearby-banner" role="alert">
      <button type="button" className="nearby-banner-main" onClick={onOpen}>
        <span className="location-notice-icon">
          <Icon name="bell" size={19} />
        </span>
        <span>
          <strong>근처에 {withJosa(place.name, '이')} 있어요!</strong>
          <small>이야기가 열렸어요. 눌러서 만나 보세요.</small>
        </span>
        <Icon name="chevron" size={18} />
      </button>
      <button type="button" className="notification-close" onClick={onClose} aria-label="알림 닫기">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}
