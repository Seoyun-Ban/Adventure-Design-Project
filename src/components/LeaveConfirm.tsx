import { ActionButton } from './ActionButton'

// 대결·보스전 도중에 나가려 할 때 뜨는 확인 창
export function LeaveConfirm({
  title,
  text,
  onStay,
  onLeave,
}: {
  title: string
  text: string
  onStay: () => void
  onLeave: () => void
}) {
  return (
    <div className="modal-layer" onClick={onStay}>
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="leave-title">{title}</h2>
        <p>{text}</p>
        <ActionButton onClick={onStay}>계속하기</ActionButton>
        <ActionButton variant="ghost" onClick={onLeave}>
          나가기
        </ActionButton>
      </section>
    </div>
  )
}
