import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Icon } from './Icon'
import { CharacterAvatar } from './CharacterAvatar'
import { TOGETHER_MIN_PLACES } from '../data/battle'
import type { AvatarLook, Tab } from '../types'

// 앱 소개 안내 (처음 지도에 들어왔을 때 한 번, 도움말의 '앱 소개 다시 보기'로 언제든)
// 화면을 살짝 어둡게 하고 설명할 곳만 밝게 비춘 뒤, 옆에 내 아바타와 말풍선으로 설명한다.
// 필요하면 아래 탭을 자동으로 옮겨 간다.

type Spot = {
  /** 비출 곳 (CSS 선택자). all이면 맞는 것을 모두 감싸는 한 곳으로 */
  selector: string
  all?: boolean
}

type Step = {
  /** 이 단계에서 보여줄 탭 */
  tab: Tab
  /** 밝게 비출 곳들 (없으면 화면 가운데에 말풍선만) */
  spots: Spot[]
  title: string
  body: ReactNode
}

const tabSpot = (tab: Tab): Spot => ({ selector: `.bottom-tabs [data-tab="${tab}"]` })

const STEPS: Step[] = [
  {
    tab: 'map',
    spots: [{ selector: '.official-korea-map' }],
    title: '여기는 역사 지도예요',
    body: '역사 장소에 직접 가면 그 장소의 이야기가 열려요.',
  },
  {
    tab: 'map',
    spots: [
      {
        selector:
          '.map-marker[data-place="gyeongbokgung"], .map-marker[data-place="suwon"], .map-marker[data-place="independence"], .map-marker[data-place="aunae"]',
        all: true,
      },
    ],
    title: '장소 표시를 읽어 볼까요?',
    body: (
      <ul className="tour-legend">
        <li>
          <i className="tour-lock">
            <Icon name="lock" size={11} />
          </i>
          회색 자물쇠: 아직 안 가 본 곳
        </li>
        <li>
          <i className="tour-dot green" /> 초록: 이야기가 열린 곳
        </li>
        <li>
          <i className="tour-foot">
            <Icon name="footprint" size={13} />
          </i>
          발자국: 학습을 마친 곳
        </li>
      </ul>
    ),
  },
  {
    tab: 'map',
    spots: [{ selector: '.map-legend' }],
    title: '지도 아래 버튼',
    body: '발자국과 학습 가능 지역을 켜고 끌 수 있어요. ‘퀴즈’를 누르면 배운 장소의 퀴즈를 풀어요.',
  },
  {
    tab: 'book',
    spots: [{ selector: '.bookshelf' }, tabSpot('book')],
    title: '이야기책',
    body: '모은 이야기를 주제별 책으로 읽어요.',
  },
  {
    tab: 'avatar',
    spots: [{ selector: '.equip-slots, .competition-button', all: true }, tabSpot('avatar')],
    title: '아바타',
    body: `학습하면 역사 아이템을 얻고 입혀 볼 수 있어요. 장소 ${TOGETHER_MIN_PLACES}곳을 학습하면 친구와 함께하는 보스전과 대결도 열려요. 문제는 배운 장소에서만 나와요!`,
  },
  {
    tab: 'profile',
    spots: [{ selector: '.profile-menu' }, { selector: '.profile-settings' }, tabSpot('profile')],
    title: '내 정보',
    body: '배지, 학습 아카이브, 도움말을 볼 수 있어요. 설정은 오른쪽 위 톱니바퀴예요.',
  },
  {
    tab: 'map',
    spots: [],
    title: '준비 완료!',
    body: '이제 가까운 역사 장소를 찾아 떠나볼까요?',
  },
]

/** 비춘 곳 하나 (안내 화면 기준 좌표, 타원) */
type Hole = { cx: number; cy: number; rx: number; ry: number; box: DOMRect }

export function AppTour({
  look,
  nickname,
  onTab,
  onFinish,
}: {
  look: AvatarLook
  nickname: string
  /** 탭 옮기기 */
  onTab: (tab: Tab) => void
  /** 끝까지 보거나 건너뛰었을 때 */
  onFinish: () => void
}) {
  const [index, setIndex] = useState(0)
  const [holes, setHoles] = useState<Hole[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const layer = useRef<HTMLDivElement>(null)
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  // 단계가 바뀌면 그 탭으로 옮긴다
  useEffect(() => {
    onTab(step.tab)
  }, [step.tab, onTab])

  /** 비출 곳을 찾아 안내 화면 좌표로 바꾼다 (컴퓨터에서 틀이 줄어 있어도 맞도록 비율을 나눈다) */
  const measure = useCallback(() => {
    const root = layer.current
    if (!root) return
    const frame = root.getBoundingClientRect()
    const scale = frame.width / root.offsetWidth || 1
    setSize({ width: root.offsetWidth, height: root.offsetHeight })
    const found: Hole[] = []
    for (const spot of step.spots) {
      const elements = [...document.querySelectorAll<HTMLElement>(spot.selector)]
      const targets = spot.all ? elements : elements.slice(0, 1)
      if (targets.length === 0) continue
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
    setHoles(found)
  }, [step])

  // 탭이 바뀐 뒤 화면이 그려지면 비출 곳을 화면 안으로 옮기고 잰다
  useLayoutEffect(() => {
    const first = step.spots[0] && document.querySelector<HTMLElement>(step.spots[0].selector)
    first?.scrollIntoView({ block: 'center', inline: 'nearest' })
    measure()
    const timers = [80, 250, 600].map((ms) => window.setTimeout(measure, ms))
    window.addEventListener('resize', measure)
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', measure)
    }
  }, [step, measure])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFinish()
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(STEPS.length - 1, value + 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

  // 말풍선(이전·다음 버튼 포함) 위치: 첫 번째로 비춘 곳의 아래, 자리가 없으면 위, 비춘 곳이 없으면 가운데
  const main = holes[0]
  const bubbleWidth = Math.min(330, size.width - 32)
  const bubbleHeight = 250
  let bubbleStyle: CSSProperties = {
    width: bubbleWidth,
    left: (size.width - bubbleWidth) / 2,
    top: Math.max(60, size.height / 2 - bubbleHeight / 2),
  }
  if (main) {
    const below = main.cy + main.ry + 12
    const above = main.cy - main.ry - 12 - bubbleHeight
    const top =
      below + bubbleHeight <= size.height - 12 ? below : above >= 56 ? above : main.cy - bubbleHeight / 2
    const left = Math.min(Math.max(16, main.cx - bubbleWidth / 2), size.width - bubbleWidth - 16)
    bubbleStyle = {
      width: bubbleWidth,
      left,
      top: Math.max(56, Math.min(top, size.height - bubbleHeight - 12)),
    }
  }

  // 비춘 곳이 오른쪽 위에 있으면(내 정보의 톱니바퀴) '건너뛰기'를 왼쪽 위로 옮겨 가리지 않게 한다
  const skipOnLeft = holes.some((hole) => hole.cx + hole.rx > size.width - 130 && hole.cy - hole.ry < 70)

  return (
    <div className="tour-layer" ref={layer} role="dialog" aria-modal="true" aria-label="앱 소개">
      <svg className="tour-shade" width={size.width} height={size.height} aria-hidden="true">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {holes.map((hole, i) => (
              <ellipse key={i} cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(18, 28, 22, 0.62)" mask="url(#tour-mask)" />
        {holes.map((hole, i) => (
          <ellipse key={i} className="tour-ring" cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} />
        ))}
      </svg>

      <button type="button" className={`tour-skip ${skipOnLeft ? 'left' : ''}`} onClick={onFinish}>
        건너뛰기
      </button>

      <div className="tour-bubble-wrap" style={bubbleStyle} key={index}>
        <div className="tour-guide">
          <CharacterAvatar look={look} label={`${nickname}의 아바타`} />
        </div>
        <section className="tour-bubble">
          <div aria-live="polite">
            <strong>{step.title}</strong>
            <div className="tour-body">{step.body}</div>
          </div>
        </section>
        {/* 이전·진행 점·다음: 아바타와 말풍선 아래에 전체 폭으로 (좁은 화면에서도 글자가 한 줄) */}
        <div className="tour-controls">
          <button
            type="button"
            className="tour-prev"
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
          >
            이전
          </button>
          <div className="tour-dots" aria-label={`${STEPS.length}단계 중 ${index + 1}단계`}>
            {STEPS.map((_, i) => (
              <i key={i} className={i === index ? 'active' : ''} />
            ))}
          </div>
          <button
            type="button"
            className="tour-next"
            onClick={() => (last ? onFinish() : setIndex(index + 1))}
          >
            {last ? '떠나 볼까요!' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
