import { Icon } from './Icon'
import { requestLeave } from '../lib/leaveGuard'
import type { IconName, Tab } from '../types'

export function BottomTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'map', label: '지도', icon: 'map' },
    { id: 'book', label: '이야기책', icon: 'book' },
    { id: 'avatar', label: '아바타', icon: 'user' },
    { id: 'profile', label: '내 정보', icon: 'profile' },
  ]
  return (
    <nav className="bottom-tabs" aria-label="주요 메뉴">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          className={active === tab.id ? 'active' : ''}
          // 대결·보스전 진행 중이면 이동하지 않고 확인 창이 먼저 뜬다
          onClick={() => {
            if (!requestLeave(() => onChange(tab.id))) onChange(tab.id)
          }}
          type="button"
        >
          <span className="tab-icon">
            <Icon name={tab.icon} size={23} />
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
