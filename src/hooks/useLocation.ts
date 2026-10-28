import { useCallback, useEffect, useRef, useState } from 'react'
import { canUseLocation } from '../lib/location'
import type { LatLng } from '../lib/geo'

// 실제 내 위치 (브라우저 위치 기능)
// - 앱을 보고 있는 동안에만 위치를 받는다 (watchPosition). 위치는 이 메모리 안에만 두고 저장하지 않는다.
// - 권한 거절·못 찾음·시간 초과에도 앱이 멈추지 않도록 상태만 바꾼다.

export type LocationStatus =
  /** 아직 켜지 않음 */
  | 'off'
  /** 위치를 찾는 중 */
  | 'locating'
  /** 위치를 받고 있음 */
  | 'on'
  /** 사용자가 위치 사용을 허락하지 않음 */
  | 'denied'
  /** 위치를 찾을 수 없음 (실내, GPS 꺼짐, 시간 초과 등) */
  | 'unavailable'
  /** 이 주소·브라우저에서는 위치 기능을 쓸 수 없음 (https가 아님 등) */
  | 'unsupported'

export type MyPosition = LatLng & {
  /** 위치 오차 (m) */
  accuracy: number
}

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>('off')
  const [position, setPosition] = useState<MyPosition | null>(null)
  const watchId = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
  }, [])

  const start = useCallback(() => {
    if (!canUseLocation()) {
      setStatus('unsupported')
      return
    }
    stop()
    setStatus('locating')
    watchId.current = navigator.geolocation.watchPosition(
      (result) => {
        setPosition({
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          accuracy: result.coords.accuracy,
        })
        setStatus('on')
      },
      (error) => {
        // 이미 위치를 받고 있었다면 잠깐 놓친 것이므로 그대로 둔다
        if (error.code === error.PERMISSION_DENIED) {
          stop()
          setPosition(null)
          setStatus('denied')
        } else {
          setStatus((current) => (current === 'on' ? current : 'unavailable'))
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
  }, [stop])

  useEffect(() => stop, [stop])

  return { status, position, start, stop }
}
