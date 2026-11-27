import { useEffect } from 'react'
import { CharacterAvatar } from './CharacterAvatar'
import { Spotlight, bubblePosition } from './Spotlight'
import { historyItems } from '../data/avatar'
import { learnedPlaceIds } from '../lib/quizGenerator'
import { useTutorial } from '../hooks/useTutorial'
import type { AvatarLook } from '../types'

// 처음 시작 체험(튜토리얼)의 화면: 스포트라이트 + 내 아바타 말풍선.
// 눌러야 할 곳만 밝게 비추고 나머지는 누를 수 없다(건너뛰기는 없음).
// 비출 곳이 8초 넘게 나타나지 않으면(불러오기 실패 등) 작은 '안내 끝내기'가 나와 막히지 않게 한다.

const GROUPS = [1, 2, 3, 4, 5, 6, 7]

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
      {(view) => {
        const position = bubblePosition(view)
        const style =
          beat.bubble === 'compact'
            ? { left: 12, width: view.size.width - 24, top: 10 }
            : beat.bubble === 'top'
              ? { ...position, top: 56 }
              : position
        const next = beat.advance.kind === 'next' ? beat.advance : null
        return (
          <div
            className={`tour-bubble-wrap tutorial-bubble ${beat.bubble === 'compact' ? 'compact' : ''}`}
            style={style}
            key={beat.id}
          >
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
                <button type="button" className="tour-next" onClick={advance}>
                  {next.label ?? '다음'}
                </button>
              ) : (
                <span className="tutorial-hint">직접 눌러 보세요</span>
              )}
            </div>
            {view.missing && (
              <button type="button" className="tutorial-escape" onClick={finish}>
                문제가 생겼어요 · 안내 끝내기
              </button>
            )}
          </div>
        )
      }}
    </Spotlight>
  )
}
