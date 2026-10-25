import { Icon } from './Icon'

export function SubpageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle: string
  onBack: () => void
}) {
  return (
    <header className="subpage-header">
      <button className="icon-button plain" onClick={onBack} type="button" aria-label="뒤로 가기">
        <Icon name="arrow" />
      </button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <span />
    </header>
  )
}
