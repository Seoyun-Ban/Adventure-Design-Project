import { useEffect, useSyncExternalStore } from 'react'

// 대결·보스전이 진행 중인지 앱 전체가 알 수 있게 한다 (진행 중에는 근처 장소 알림 배너를 미룬다)
let count = 0
const listeners = new Set<() => void>()

function change(delta: number) {
  count += delta
  listeners.forEach((listener) => listener())
}

/** 화면이 진행 중인 동안 active를 true로 둔다 */
export function useGameBusy(active: boolean) {
  useEffect(() => {
    if (!active) return
    change(1)
    return () => change(-1)
  }, [active])
}

/** 지금 대결·보스전이 진행 중이면 true */
export function useIsGameBusy() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => count > 0,
  )
}
