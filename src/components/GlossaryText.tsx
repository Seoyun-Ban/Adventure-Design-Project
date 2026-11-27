import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { GlossaryEntry } from '../data/glossary'
import type { GlossarySegment } from '../lib/glossary'

// 낱말 풀이: 점선 밑줄 낱말을 누르면(또는 Enter·Space) 그 낱말 바로 아래에 작은 말풍선으로 "낱말(한자) - 풀이"가 뜬다.
// - 낱말이 화면 아래쪽이면 위쪽에, 양쪽 끝이면 화면 안쪽으로 밀어서 화면 밖으로 나가지 않는다 (꼬리는 낱말을 계속 가리킨다)
// - 바깥을 누르거나, 스크롤하거나, Esc를 누르면 닫힌다 (Esc로 닫으면 포커스가 그 낱말로 돌아온다)
// - 말풍선은 GlossaryProvider가 한 개만 그린다. 위치는 화면에 실제로 그려진 크기를 재서 정한다
//   (컴퓨터 화면의 휴대폰 틀처럼 확대·축소된 곳에서도 맞도록, 말풍선 자신의 좌표를 기준으로 환산한다)

type Open = (entry: GlossaryEntry, trigger: HTMLElement) => void
const GlossaryContext = createContext<{ open: Open; current: GlossaryEntry | null } | null>(null)

/** 화면 가장자리에서 띄우는 거리, 낱말과 말풍선 사이 거리 (화면에 보이는 px) */
const MARGIN = 8
const GAP = 10
/** 말풍선 최대 너비: 화면 폭의 70%, 그리고 이 값을 넘지 않게 (실제 px) */
const MAX_WIDTH_RATIO = 0.7
const MAX_WIDTH_PX = 320

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/** 이 안의 GlossaryText가 낱말을 누르면 말풍선이 하나 뜬다 */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<GlossaryEntry | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const bubble = useRef<HTMLDivElement>(null)

  const open = useCallback<Open>((entry, button) => {
    trigger.current = button
    // 같은 낱말을 다시 누르면 닫는다
    setCurrent((now) => (now === entry ? null : entry))
  }, [])
  const close = useCallback(() => setCurrent(null), [])

  // 말풍선 위치: 그려진 뒤(화면에 보이기 전에) 크기를 재서 낱말 아래(또는 위)에 놓는다
  useLayoutEffect(() => {
    const el = bubble.current
    const word = trigger.current
    if (!current || !el || !word) return
    // 1) 왼쪽 위 구석(0, 0)에 놓고 말풍선 자신의 좌표계가 화면과 얼마나 다른지 잰다 (확대·축소와 기준 위치)
    el.style.left = '0px'
    el.style.top = '0px'
    el.style.maxWidth = 'none'
    const zero = el.getBoundingClientRect()
    const scale = el.offsetWidth > 0 ? zero.width / el.offsetWidth : 1
    // 2) 보이는 영역: 화면과 앱 틀이 겹치는 부분 (화면에 보이는 px)
    const frame = word.closest('.app-frame')?.getBoundingClientRect()
    const viewWidth = document.documentElement.clientWidth
    const viewHeight = window.innerHeight
    const area = {
      left: Math.max(0, frame?.left ?? 0),
      right: Math.min(viewWidth, frame?.right ?? viewWidth),
      top: Math.max(0, frame?.top ?? 0),
      bottom: Math.min(viewHeight, frame?.bottom ?? viewHeight),
    }
    // 3) 너비는 화면 폭의 70%까지 (휴대폰), 높이는 글에 맞춰 늘어난다
    const maxScreenWidth = Math.min((area.right - area.left) * MAX_WIDTH_RATIO, MAX_WIDTH_PX * scale)
    el.style.maxWidth = `${maxScreenWidth / scale}px`
    const size = el.getBoundingClientRect()
    // 4) 낱말 아래가 기본, 아래에 자리가 모자라면 위쪽 (둘 다 모자라면 더 넓은 쪽)
    const rect = word.getClientRects()[0] ?? word.getBoundingClientRect()
    const below = area.bottom - rect.bottom - GAP - MARGIN
    const above = rect.top - area.top - GAP - MARGIN
    const placeBelow = size.height <= below || below >= above
    const top = placeBelow ? rect.bottom + GAP : rect.top - GAP - size.height
    // 5) 양쪽 끝이면 화면 안쪽으로 밀고, 꼬리는 낱말 가운데를 계속 가리킨다
    const center = (rect.left + rect.right) / 2
    const left = clamp(
      center - size.width / 2,
      area.left + MARGIN,
      Math.max(area.left + MARGIN, area.right - MARGIN - size.width),
    )
    const tail = clamp(center - left, 16, Math.max(16, size.width - 16))
    // 6) 화면 좌표를 말풍선 좌표로 환산해서 적는다
    el.style.left = `${(left - zero.left) / scale}px`
    el.style.top = `${(top - zero.top) / scale}px`
    el.style.setProperty('--tail-x', `${tail / scale}px`)
    el.dataset.placement = placeBelow ? 'below' : 'above'
    el.dataset.placed = 'true'
  }, [current])

  // 열려 있는 동안: 바깥을 누르거나 스크롤·크기 변경이면 닫고, Esc는 닫은 뒤 낱말로 포커스를 돌려준다
  useEffect(() => {
    if (!current) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      // 말풍선 안은 그대로, 낱말을 누르는 것은 낱말의 클릭(열기·닫기·다른 낱말로 바꾸기)에 맡긴다
      if (target?.closest('.gloss-bubble, .gloss')) return
      close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      close()
      trigger.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    // 스크롤은 어느 영역에서 일어나든(앱 틀 안 스크롤 포함) 잡도록 capture로 듣는다
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [current, close])

  return (
    <GlossaryContext.Provider value={{ open, current }}>
      {children}
      {current && (
        <div className="gloss-bubble" id="gloss-bubble" role="tooltip" ref={bubble} key={current.word}>
          <span className="gloss-tail" aria-hidden="true" />
          <p>
            <b>
              {current.word}
              {current.hanja ? `(${current.hanja})` : ''}
            </b>
            {' - '}
            {current.meaning}
          </p>
        </div>
      )}
    </GlossaryContext.Provider>
  )
}

/** annotate()가 쪼갠 글. 풀이가 있는 조각은 점선 밑줄 버튼으로 그린다 (GlossaryProvider 밖이면 그냥 글로 보인다) */
export function GlossaryText({ segments }: { segments: GlossarySegment[] }) {
  const glossary = useContext(GlossaryContext)
  return (
    <>
      {segments.map((segment, index) =>
        segment.entry && glossary ? (
          <button
            type="button"
            className="gloss"
            key={index}
            aria-expanded={glossary.current === segment.entry}
            aria-describedby={glossary.current === segment.entry ? 'gloss-bubble' : undefined}
            aria-label={`${segment.text}, 뜻 보기`}
            onClick={(event) => glossary.open(segment.entry!, event.currentTarget)}
          >
            {segment.text}
          </button>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}
