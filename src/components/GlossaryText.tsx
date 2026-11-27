import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { GlossaryEntry } from '../data/glossary'
import { glossaryLine, type GlossarySegment } from '../lib/glossary'

// 낱말 풀이: 점선 밑줄 낱말을 누르면(또는 Enter·Space) 작은 창에 "낱말(한자) - 풀이"가 나온다.
// 바깥을 누르거나 Esc·닫기 버튼으로 닫는다. 풀이 창은 GlossaryProvider가 한 개만 그린다.

type Open = (entry: GlossaryEntry, trigger: HTMLElement) => void
const GlossaryContext = createContext<Open | null>(null)

/** 이 안의 GlossaryText가 낱말을 누르면 풀이 창이 이 아래에 하나 뜬다 */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ entry: GlossaryEntry } | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  const trigger = useRef<HTMLElement | null>(null)

  const open = useCallback<Open>((entry, button) => {
    trigger.current = button
    // 같은 낱말을 다시 누르면 닫는다
    setCurrent((now) => (now?.entry === entry ? null : { entry }))
  }, [])
  const close = useCallback(() => {
    setCurrent(null)
    trigger.current?.focus() // 키보드로 열었다면 닫은 뒤 그 낱말로 돌아온다
  }, [])

  useEffect(() => {
    if (!current) return
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, close])

  return (
    <GlossaryContext.Provider value={open}>
      {children}
      {current && (
        <div className="gloss-layer" onClick={close}>
          <div
            className="gloss-card"
            role="dialog"
            aria-label="낱말 풀이"
            onClick={(event) => event.stopPropagation()}
          >
            <p>{glossaryLine(current.entry)}</p>
            <button type="button" ref={closeButton} onClick={close}>
              닫기
            </button>
          </div>
        </div>
      )}
    </GlossaryContext.Provider>
  )
}

/** annotate()가 쪼갠 글. 풀이가 있는 조각은 점선 밑줄 버튼으로 그린다 (GlossaryProvider 밖이면 그냥 글로 보인다) */
export function GlossaryText({ segments }: { segments: GlossarySegment[] }) {
  const open = useContext(GlossaryContext)
  return (
    <>
      {segments.map((segment, index) =>
        segment.entry && open ? (
          <button
            type="button"
            className="gloss"
            key={index}
            aria-haspopup="dialog"
            aria-label={`${segment.text}, 뜻 보기`}
            onClick={(event) => open(segment.entry!, event.currentTarget)}
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
