import { Icon } from './Icon'
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
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
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
