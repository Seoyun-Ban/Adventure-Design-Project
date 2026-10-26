import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { SubpageHeader } from '../components/SubpageHeader'
import type { Difficulty } from '../types'

export function SettingsScreen({
  loggedIn,
  nickname,
  email,
  difficulty,
  pushEnabled,
  onDifficultyChange,
  onPushChange,
  onReset,
  onEditAvatar,
  onEditNickname,
  onBack,
  onLogin,
  onLogout,
}: {
  loggedIn: boolean
  nickname: string
  email?: string
  difficulty: Difficulty
  pushEnabled: boolean
  onDifficultyChange: (difficulty: Difficulty) => void
  onPushChange: (enabled: boolean) => void
  onReset: () => void
  onEditAvatar: () => void
  onEditNickname: () => void
  onBack: () => void
  onLogin: () => void
  onLogout: () => void
}) {
  return (
    <section className="utility-screen settings-screen">
      <SubpageHeader title="설정" subtitle="나에게 맞는 학습 환경" onBack={onBack} />
      <div className="settings-group">
        <div className="settings-group-title">
          <span>학습 설정</span>
          <small>기본으로 사용할 단계를 골라주세요.</small>
        </div>
        <div className="settings-row difficulty-setting">
          <div>
            <strong>기본 학습 단계</strong>
            <span>학습 화면에서 언제든 바꿀 수 있어요.</span>
          </div>
          <div className="settings-segments">
            {(['쉬움', '보통', '어려움'] as Difficulty[]).map((item) => (
              <button
                type="button"
                key={item}
                className={difficulty === item ? 'active' : ''}
                onClick={() => onDifficultyChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group-title">
          <span>알림</span>
          <small>주변의 역사를 놓치지 않도록 알려드려요.</small>
        </div>
        <div className="settings-row push-setting">
          <span className="settings-icon">
            <Icon name="bell" size={20} />
          </span>
          <div>
            <strong>푸시 알림</strong>
            <span>{pushEnabled ? '근처의 학습 장소를 알려드려요.' : '모든 알림이 꺼져 있어요.'}</span>
          </div>
          <button
            type="button"
            className={`settings-toggle ${pushEnabled ? 'on' : ''}`}
            onClick={() => onPushChange(!pushEnabled)}
            aria-pressed={pushEnabled}
          >
            <span />
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group-title">
          <span>아바타</span>
          <small>외형과 등록한 얼굴을 다시 설정해요.</small>
        </div>
        <button type="button" className="settings-row push-setting" onClick={onEditAvatar}>
          <span className="settings-icon">
            <Icon name="camera" size={20} />
          </span>
          <div>
            <strong>아바타·얼굴 다시 설정</strong>
            <span>처음 설정 화면으로 이동해요.</span>
          </div>
          <Icon name="chevron" size={18} />
        </button>
      </div>
      <div className="account-card">
        <div className="settings-icon account">
          <Icon name="user" size={21} />
        </div>
        <div>
          <strong>{loggedIn ? nickname : '로그인하지 않음'}</strong>
          <span>
            {loggedIn ? email || '간편 로그인 계정' : '로그인하면 지금까지의 기록이 계정에 저장돼요.'}
          </span>
        </div>
        <button type="button" className="account-nickname" onClick={onEditNickname}>
          <span className="settings-icon">
            <Icon name="edit" size={18} />
          </span>
          <span>
            <strong>닉네임 바꾸기</strong>
            <small>지금 닉네임: {nickname}</small>
          </span>
          <Icon name="chevron" size={18} />
        </button>
      </div>
      <ActionButton variant={loggedIn ? 'ghost' : 'primary'} onClick={loggedIn ? onLogout : onLogin}>
        {loggedIn ? '로그아웃' : '로그인'}
      </ActionButton>
      <ActionButton variant="ghost" onClick={onReset}>
        학습 기록 초기화
      </ActionButton>
      <p className="app-version">역사 한걸음 · 버전 1.0.0</p>
    </section>
  )
}
