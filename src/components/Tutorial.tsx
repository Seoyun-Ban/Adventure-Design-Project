import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CharacterAvatar } from './CharacterAvatar'
import { Spotlight, placeBubble, type SpotlightView } from './Spotlight'
import { historyItems } from '../data/avatar'
import type { Beat } from '../data/tutorial'
import { learnedPlaceIds } from '../lib/quizGenerator'
import { useTutorial } from '../hooks/useTutorial'
import type { AvatarLook } from '../types'

// 처음 시작 체험(튜토리얼)의 화면: 스포트라이트 + 내 아바타 말풍선.
// 눌러야 할 곳만 밝게 비추고 나머지는 누를 수 없다(건너뛰기는 없음).
// 말풍선은 밝게 비춘 곳을 가리지 않는 자리에 뜨고, 자리가 모자라면 화면 맨 위·맨 아래의 한 줄 띠가 된다.
// 비출 곳이 8초 넘게 나타나지 않으면(불러오기 실패 등) '안내 끝내기'가 나와 막히지 않게 한다.

const GROUPS = [1, 2, 3, 4, 5, 6, 7]
/** 한 줄 띠의 높이 (index.css의 .tutorial-strip과 같게) */
const STRIP_HEIGHT = 44

export function Tutorial({
  look,
  nickname,
  completedIds,
}: {
  look: AvatarLook
  nickname: string
  completedIds: string[]
}) {
  const { beat, advance, finish } = useTutorial()

  // '눌러 보세요' 단계: 비춘 곳을 누르면 다음으로 (이 단계가 시작되기 전의 누름은 무시)
  const tapSelector = beat?.advance.kind === 'tap' ? beat.advance.selector : null
  useEffect(() => {
    if (!tapSelector) return
    const armedAt = performance.now()
    const onClick = (event: MouseEvent) => {
      if (event.timeStamp < armedAt) return
      if (event.target instanceof Element && event.target.closest(tapSelector)) advance()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [tapSelector, advance])

  if (!beat) return null
  const facts = {
    learned: learnedPlaceIds(completedIds).length,
    owned: historyItems.filter((item) => completedIds.includes(item.placeId)).length,
    totalItems: historyItems.length,
  }
  const body = typeof beat.body === 'function' ? beat.body(facts) : beat.body

  return (
    <Spotlight
      spots={beat.spots}
      stepKey={beat.id}
      guard
      allow={beat.allow}
      scroll={!beat.noScroll}
      missingMs={8000}
      label="처음 시작 안내"
    >
      {(view) => (
        <TutorialBubble
          beat={beat}
          body={body}
          view={view}
          look={look}
          nickname={nickname}
          onNext={advance}
          onFinish={finish}
        />
      )}
    </Spotlight>
  )
}

function TutorialBubble({
  beat,
  body,
  view,
  look,
  nickname,
  onNext,
  onFinish,
}: {
  beat: Beat
  body: string
  view: SpotlightView
  look: AvatarLook
  nickname: string
  onNext: () => void
  onFinish: () => void
}) {
  // 말풍선이 실제로 차지하는 높이를 숨은 복사본으로 재서, 비춘 곳 위·아래에 들어가는지 판단한다
  const measure = useRef<HTMLDivElement>(null)
  const [fullHeight, setFullHeight] = useState(240)
  useLayoutEffect(() => {
    const height = measure.current?.offsetHeight
    if (height && height !== fullHeight) setFullHeight(height)
  }, [beat.id, body, view.size.width, view.missing, fullHeight])

  const fullWidth = Math.min(330, view.size.width - 32)
  const place = placeBubble(view, fullHeight, STRIP_HEIGHT, beat.stripOnly)
  const next = beat.advance.kind === 'next' ? beat.advance : null

  const full = (
    <>
      <div className="tour-guide">
        <CharacterAvatar look={look} label={`${nickname}의 아바타`} />
      </div>
      <section className="tour-bubble">
        <div aria-live="polite">
          <strong>{beat.title}</strong>
          <div className="tour-body tutorial-body">{body}</div>
        </div>
      </section>
      <div className="tour-controls">
        <div className="tour-dots" aria-label={`${GROUPS.length}단계 중 ${beat.group}단계`}>
          {GROUPS.map((group) => (
            <i key={group} className={group === beat.group ? 'active' : ''} />
          ))}
        </div>
        {next ? (
          <button type="button" className="tour-next" onClick={onNext}>
            {next.label ?? '다음'}
          </button>
        ) : (
          <span className="tutorial-hint">직접 눌러 보세요</span>
        )}
      </div>
      {view.missing && (
        <button type="button" className="tutorial-escape" onClick={onFinish}>
          문제가 생겼어요 · 안내 끝내기
        </button>
      )}
    </>
  )

  return (
    <>
      <div
        className="tour-bubble-wrap tutorial-bubble tutorial-measure"
        ref={measure}
        aria-hidden="true"
        style={{ width: fullWidth }}
      >
        {full}
      </div>
      {place.mode === 'full' ? (
        <div
          className="tour-bubble-wrap tutorial-bubble"
          style={{ width: fullWidth, left: place.left, top: place.top }}
          key={beat.id}
        >
          {full}
        </div>
      ) : (
        <div
          className="tutorial-strip"
          style={{ left: place.left, top: place.top, width: view.size.width - 24 }}
          key={beat.id}
          role="status"
        >
          <span className="tutorial-strip-text">
            {view.missing ? '문제가 생겼어요' : (beat.strip ?? beat.title)}
          </span>
          {view.missing ? (
            <button type="button" className="tutorial-escape" onClick={onFinish}>
              안내 끝내기
            </button>
          ) : (
            next && (
              <button type="button" className="tour-next" onClick={onNext}>
                {next.label ?? '다음'}
              </button>
            )
          )}
        </div>
      )}
    </>
  )
}
