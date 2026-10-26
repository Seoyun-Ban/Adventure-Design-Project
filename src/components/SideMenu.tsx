import { Icon } from './Icon'
import { CharacterAvatar } from './CharacterAvatar'
import { levelFor } from '../data/avatar'
import type { AvatarLook, IconName, SubPage } from '../types'

export function SideMenu({
  open,
  nickname,
  look,
  footprintCount,
  onClose,
  onNavigate,
}: {
  open: boolean
  nickname: string
  look: AvatarLook
  footprintCount: number
  onClose: () => void
  onNavigate: (page: SubPage) => void
}) {
  const items: { icon: IconName; label: string; desc: string; target: SubPage }[] = [
    { icon: 'archive', label: '학습 아카이브', desc: '지금까지 만난 이야기', target: 'archive' },
    { icon: 'quiz', label: '퀴즈', desc: '새로운 문제에 도전하기', target: 'quiz-new' },
    { icon: 'refresh', label: '복습 퀴즈', desc: '이미 푼 퀴즈 다시 보기', target: 'quiz-review' },
    { icon: 'settings', label: '설정', desc: '알림과 앱 환경 설정', target: 'settings' },
  ]
  return (
    <div className={`drawer-layer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button className="drawer-backdrop" onClick={onClose} type="button" aria-label="메뉴 닫기" />
      <aside className="side-menu">
        <div className="drawer-head">
          <div className="mini-brand">
            <Icon name="footprint" size={22} />
          </div>
          <button className="icon-button plain" onClick={onClose} type="button" aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <div className="traveler-card">
          <div className="avatar-small">
            <CharacterAvatar look={look} label={`${nickname}의 아바타`} />
          </div>
          <div>
            <strong>{nickname}</strong>
            <span>발자국 {footprintCount}개</span>
          </div>
          <span className="level-chip">Lv. {levelFor(footprintCount)}</span>
        </div>
        <div className="drawer-progress">
          <div>
            <span>이번 주 걸음</span>
            <strong>3 / 5</strong>
          </div>
          <div className="progress-track">
            <span />
          </div>
        </div>
        <div className="menu-list">
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                onNavigate(item.target)
                onClose()
              }}
            >
              <span className="menu-item-icon">
                <Icon name={item.icon} size={21} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
        <p className="drawer-quote">“역사는 발밑에서 시작됩니다.”</p>
      </aside>
    </div>
  )
}
