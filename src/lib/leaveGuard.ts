import { useEffect, useRef } from 'react'

// 대결·보스전을 하는 도중에 나가려는 동작(아래 탭 메뉴, 휴대폰 뒤로가기)을 가로채서 확인 창을 띄운다.
// - 쓰는 곳: 진행 중인 화면이 useLeaveGuard(진행 중인지, 물어보는 함수)를 부른다.
// - 탭 메뉴는 BottomTabs가 requestLeave로 먼저 물어보고, 가로채졌으면(true) 이동하지 않는다.
// - 뒤로가기는 화면이 진행 중인 동안 기록 한 칸(history 항목)을 더 쌓아 두고, 뒤로가기가 눌리면 그 칸을 다시 쌓고 확인 창을 띄운다.
type Ask = (proceed?: () => void) => void

let current: Ask | null = null
/** 우리가 쌓아 둔 기록 한 칸이 있는지 */
let pushed = false
/** 우리가 일부러 부른 history.back()이 일으키는 popstate는 무시한다 */
let ignorePop = false
let listening = false

function onPopState() {
  if (ignorePop) {
    ignorePop = false
    return
  }
  if (!current) return
  // 뒤로가기로 한 칸이 빠졌으니 다시 쌓고(화면은 그대로), 확인 창을 띄운다
  window.history.pushState({ leaveGuard: true }, '')
  current()
}

function attach() {
  if (!listening) {
    window.addEventListener('popstate', onPopState)
    listening = true
  }
  if (!pushed) {
    window.history.pushState({ leaveGuard: true }, '')
    pushed = true
  }
}

function detach() {
  if (pushed) {
    pushed = false
    ignorePop = true
    window.history.back()
  }
}

/** 탭 메뉴 등에서 이동하기 전에 부른다. 진행 중이라 확인 창을 띄웠으면 true (이동하지 말 것) */
export function requestLeave(proceed: () => void) {
  if (!current) return false
  current(proceed)
  return true
}

/** active가 true인 동안 나가기를 가로채고, ask로 확인 창을 띄운다 (proceed: 확인 뒤에 이어서 할 일) */
export function useLeaveGuard(active: boolean, ask: Ask) {
  const askRef = useRef(ask)
  askRef.current = ask
  useEffect(() => {
    if (!active) return
    const handler: Ask = (proceed) => askRef.current(proceed)
    current = handler
    attach()
    return () => {
      if (current === handler) current = null
      // StrictMode 등으로 바로 다시 켜질 수 있으니, 잠깐 기다렸다가 그대로 꺼져 있을 때만 쌓아 둔 칸을 치운다
      window.setTimeout(() => {
        if (!current) detach()
      }, 0)
    }
  }, [active])
}
