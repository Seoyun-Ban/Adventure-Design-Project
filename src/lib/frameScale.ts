// 컴퓨터 화면에서 휴대폰 모양 틀(393×852)이 항상 화면 안에 다 들어오도록 크기를 맞춘다.
// 화면 세로가 짧으면 틀을 통째로 비율 그대로 줄인다 (CSS 변수 --frame-scale, index.css의 min-width: 500px 부분).
// 휴대폰(가로 500px 미만)은 틀 없이 화면을 꽉 채우므로 1 그대로다.

const FRAME_WIDTH = 393
const FRAME_HEIGHT = 852
/** 틀 위아래·양옆 여백 */
const GAP = 24
const DESKTOP = '(min-width: 500px)'

let scale = 1

function update() {
  const desktop = window.matchMedia(DESKTOP).matches
  scale = desktop
    ? Math.min(1, (window.innerHeight - GAP * 2) / FRAME_HEIGHT, (window.innerWidth - GAP * 2) / FRAME_WIDTH)
    : 1
  scale = Math.max(0.3, scale)
  document.documentElement.style.setProperty('--frame-scale', String(scale))
}

/** 앱을 켤 때 한 번 부른다. 창 크기가 바뀌면 다시 계산한다. */
export function watchFrameScale() {
  update()
  window.addEventListener('resize', update)
}

/** 지금 틀이 줄어든 비율 (마우스로 지도를 끌 때 이동 거리를 맞추는 데 쓴다) */
export function frameScale() {
  return scale
}

/** 화면을 바꿀 때 맨 위로. 컴퓨터에서는 틀 안의 스크롤 영역(.app-scroll)이 스크롤된다. */
export function scrollAppToTop() {
  window.scrollTo(0, 0)
  document.querySelector('.app-scroll')?.scrollTo(0, 0)
}
