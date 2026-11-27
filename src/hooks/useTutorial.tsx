import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  BEATS,
  TUTORIAL_PLACE,
  startBeatIndex,
  tutorialEnabled,
  tutorialItems,
  type Beat,
} from '../data/tutorial'
import type { Equipped } from '../types'
import type { Progress } from './useProgress'

// 처음 시작 체험(튜토리얼)의 진행 상태.
// - 저장하는 것은 묶음 번호(progress.tutorialStep, 1~7)뿐. 끝나면 지운다(undefined).
// - 몇 번째 말풍선인지는 메모리에만 두고, 앱을 다시 열면 묶음의 처음부터 이어간다(startBeatIndex).
// - 화면들은 useTutorial()로 지금 단계를 알아보고, signal()로 '이 일을 했어요'를 알린다.

export type TutorialApi = {
  /** 튜토리얼이 진행 중인지 (다른 알림이 끼어들지 않게 막는 데 쓴다) */
  active: boolean
  beat: Beat | null
  /** 읽기만 하는 단계에서 '다음'을 눌렀을 때, 또는 비춘 곳을 눌렀을 때 */
  advance: () => void
  /** 화면이 알려 주는 신호 (현재 단계가 기다리는 신호면 다음으로) */
  signal: (name: string) => void
  /** 끝내기 */
  finish: () => void
}

const idle: TutorialApi = { active: false, beat: null, advance() {}, signal() {}, finish() {} }
const TutorialContext = createContext<TutorialApi>(idle)
export const TutorialProvider = TutorialContext.Provider
export const useTutorial = () => useContext(TutorialContext)

const worn = (equipped: Equipped) => tutorialItems.every((item) => equipped[item.category] === item.id)

export function useTutorialController({
  step,
  update,
  completedIds,
  equipped,
}: {
  step: Progress['tutorialStep']
  update: (patch: Partial<Progress>) => void
  completedIds: string[]
  equipped: Equipped
}): TutorialApi {
  const latest = useRef({ update, completedIds, equipped })
  latest.current = { update, completedIds, equipped }
  const startAt = (group: number) =>
    startBeatIndex(group, latest.current.completedIds.includes(TUTORIAL_PLACE), worn(latest.current.equipped))

  const [index, setIndex] = useState(() => (step && tutorialEnabled() ? startAt(step) : -1))
  const indexRef = useRef(index)
  indexRef.current = index

  // 온보딩을 마쳐 묶음 번호가 생기면 시작한다
  useEffect(() => {
    if (step && index < 0 && tutorialEnabled()) setIndex(startAt(step))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // 기록이 처음으로 돌아가(처음부터 다시 시작하기·탈퇴) 묶음 번호가 사라지면 진행 중이던 것도 멈춘다
  useEffect(() => {
    if (!step && indexRef.current >= 0) {
      indexRef.current = -1
      setIndex(-1)
    }
  }, [step])

  // 단계가 바뀌어 묶음이 달라지면 저장한다 (앱을 닫았다 열면 그 묶음에서 이어간다)
  const group = index >= 0 ? BEATS[index].group : undefined
  useEffect(() => {
    if (group !== undefined && group !== step) latest.current.update({ tutorialStep: group })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group])

  const finish = useCallback(() => {
    indexRef.current = -1
    setIndex(-1)
    latest.current.update({ tutorialStep: undefined })
  }, [])

  const advance = useCallback(() => {
    const now = indexRef.current
    if (now < 0) return
    if (now + 1 >= BEATS.length) {
      finish()
      return
    }
    indexRef.current = now + 1
    setIndex(now + 1)
  }, [finish])

  const signal = useCallback(
    (name: string) => {
      const beat = BEATS[indexRef.current]
      if (beat && beat.advance.kind === 'signal' && beat.advance.name === name) advance()
    },
    [advance],
  )

  return { active: index >= 0, beat: index >= 0 ? BEATS[index] : null, advance, signal, finish }
}
