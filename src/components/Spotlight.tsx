import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

// 스포트라이트: 화면을 살짝 어둡게 하고 비출 곳만 밝게 보여주는 공통 부품.
// - 앱 소개(AppTour): 화면 전체를 막는다(block).
// - 튜토리얼(Tutorial): 어둡게만 하고(스크롤은 그대로), 비춘 곳 밖을 누르면 가드가 취소한다(guard).

export type Spot = {
  /** 비출 곳 (CSS 선택자). all이면 맞는 것을 모두 감싸는 한 곳으로 */
  selector: string
  all?: boolean
}

/** 비춘 곳 하나 (안내 화면 기준 좌표, 타원) */
export type Hole = { cx: number; cy: number; rx: number; ry: number; box: DOMRect }

export type SpotlightView = {
  holes: Hole[]
  size: { width: number; height: number }
  /** 비출 곳이 한동안(missingMs) 화면에 나타나지 않았는지 */
  missing: boolean
}

export function Spotlight({
  spots,
  stepKey,
  guard = false,
  allow,
  missingMs = 0,
  label,
  className = '',
  children,
}: {
  spots: Spot[]
  /** 단계가 바뀌었음을 알리는 값 (바뀌면 다시 찾고 화면 안으로 옮긴다) */
  stepKey: string | number
  /** true: 비춘 곳 밖 누르기를 취소 (스크롤은 막지 않는다) */
  guard?: boolean
  /** guard일 때 비춘 곳 말고도 눌러도 되는 곳 (CSS 선택자) */
  allow?: string
  /** 0보다 크면, 첫 비출 곳이 이 시간(ms) 동안 안 보일 때 missing = true */
  missingMs?: number
  label: string
  className?: string
  children: (view: SpotlightView) => ReactNode
}) {
  const [holes, setHoles] = useState<Hole[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [missing, setMissing] = useState(false)
  const layer = useRef<HTMLDivElement>(null)
  const spotsRef = useRef(spots)
  spotsRef.current = spots
  const allowRef = useRef(allow)
  allowRef.current = allow
  const scrolled = useRef(false)

  /** 비출 곳을 찾아 안내 화면 좌표로 바꾼다 (컴퓨터에서 틀이 줄어 있어도 맞도록 비율을 나눈다) */
  const measure = useCallback(() => {
    const root = layer.current
    if (!root) return
    const frame = root.getBoundingClientRect()
    const scale = frame.width / root.offsetWidth || 1
    const next = { width: root.offsetWidth, height: root.offsetHeight }
    setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    const found: Hole[] = []
    let firstElement: HTMLElement | undefined
    for (const spot of spotsRef.current) {
      const elements = [...document.querySelectorAll<HTMLElement>(spot.selector)].filter(
        (element) => !root.contains(element),
      )
      const targets = spot.all ? elements : elements.slice(0, 1)
      if (targets.length === 0) continue
      firstElement ??= targets[0]
      const rects = targets.map((element) => element.getBoundingClientRect())
      const left = Math.min(...rects.map((r) => r.left))
      const top = Math.min(...rects.map((r) => r.top))
      const right = Math.max(...rects.map((r) => r.right))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      const box = new DOMRect(
        (left - frame.left) / scale,
        (top - frame.top) / scale,
        (right - left) / scale,
        (bottom - top) / scale,
      )
      // 네모를 넉넉히 감싸는 타원 (정사각형에 가까우면 원)
      found.push({
        cx: box.x + box.width / 2,
        cy: box.y + box.height / 2,
        rx: box.width / 2 / 0.78 + 6,
        ry: box.height / 2 / 0.78 + 6,
        box,
      })
    }
    // 처음 나타났을 때 한 번 화면 안으로 옮긴다 (그 뒤에는 사용자가 스크롤하는 대로 둔다)
    if (firstElement && !scrolled.current) {
      scrolled.current = true
      firstElement.scrollIntoView({ block: 'center', inline: 'nearest' })
    }
    setHoles((prev) => {
      const same =
        prev.length === found.length &&
        prev.every(
          (hole, i) =>
            Math.abs(hole.cx - found[i].cx) < 0.5 &&
            Math.abs(hole.cy - found[i].cy) < 0.5 &&
            Math.abs(hole.rx - found[i].rx) < 0.5 &&
            Math.abs(hole.ry - found[i].ry) < 0.5,
        )
      return same ? prev : found
    })
  }, [])

  // 단계가 바뀌면 처음부터 다시 찾는다. 화면이 그려지는 동안(탭 옮기기, 문제 불러오기 등) 계속 다시 잰다.
  useEffect(() => {
    scrolled.current = false
    setMissing(false)
    measure()
    const timer = window.setInterval(measure, 250)
    const onScroll = () => measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, true)
    const missingTimer = missingMs
      ? window.setTimeout(() => {
          const first = spotsRef.current[0]
          if (first && !document.querySelector(first.selector)) setMissing(true)
        }, missingMs)
      : undefined
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(missingTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [stepKey, measure, missingMs])

  // 가드: 비춘 곳(과 allow) 밖을 누르면 취소한다. 비춘 곳 안·안내 화면 위는 그대로 통과.
  useEffect(() => {
    if (!guard) return
    const onClick = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (layer.current?.contains(target)) return
      if (allowRef.current && target.closest(allowRef.current)) return
      for (const spot of spotsRef.current) {
        const hit = [...document.querySelectorAll(spot.selector)].some((element) => element.contains(target))
        if (hit) return
      }
      event.preventDefault()
      event.stopPropagation()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [guard])

  const maskId = `spot-mask-${guard ? 'g' : 'b'}`

  return (
    <div
      className={`tour-layer ${guard ? 'guard' : ''} ${className}`}
      ref={layer}
      role={guard ? 'region' : 'dialog'}
      aria-modal={guard ? undefined : true}
      aria-label={label}
    >
      <svg className="tour-shade" width={size.width} height={size.height} aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {holes.map((hole, i) => (
              <ellipse key={i} cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(18, 28, 22, 0.62)" mask={`url(#${maskId})`} />
        {holes.map((hole, i) => (
          <ellipse key={i} className="tour-ring" cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} />
        ))}
      </svg>
      {children({ holes, size, missing })}
    </div>
  )
}

/** 첫 번째 비춘 곳 근처에 말풍선을 놓는 위치 (아래, 자리가 없으면 위, 비춘 곳이 없으면 가운데) */
export function bubblePosition(view: SpotlightView, bubbleHeight = 250) {
  const { holes, size } = view
  const main = holes[0]
  const width = Math.min(330, size.width - 32)
  if (!main) {
    return { width, left: (size.width - width) / 2, top: Math.max(60, size.height / 2 - bubbleHeight / 2) }
  }
  const below = main.cy + main.ry + 12
  const above = main.cy - main.ry - 12 - bubbleHeight
  const top =
    below + bubbleHeight <= size.height - 12 ? below : above >= 56 ? above : main.cy - bubbleHeight / 2
  const left = Math.min(Math.max(16, main.cx - width / 2), size.width - width - 16)
  return { width, left, top: Math.max(56, Math.min(top, size.height - bubbleHeight - 12)) }
}
