import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

// 화면 아래에서 올라오는 작은 창 (바텀시트). 바깥을 누르거나 Esc 키를 누르면 닫힌다.
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-layer" onClick={onClose}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-button plain" type="button" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
