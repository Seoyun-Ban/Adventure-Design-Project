import { useState, type FormEvent } from 'react'
import { ActionButton } from '../components/ActionButton'
import { FieldHint } from '../components/AuthHeader'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { FacePhotoField } from '../components/FacePhotoField'
import { NICKNAME_MAX } from '../components/NicknameSheet'
import { LookFields } from '../components/OptionRow'
import { SubpageHeader } from '../components/SubpageHeader'
import { AccountSection, EmailChange, PasswordChange, type AccountView } from '../components/AccountSection'
import type { AvatarLook, SocialProvider } from '../types'

// 설정 > 개인정보 고치기: 닉네임, 성별, 머리 모양, 얼굴 사진 + 계정 관리(이메일·비밀번호 바꾸기, 회원 탈퇴)
// '저장'을 눌러야 바뀐다. 얼굴 사진은 이 기기에만 저장되고 학습 영상 장면에서만 쓰인다.
export function ProfileEditScreen({
  nickname,
  look,
  faceImage,
  onSave,
  onBack,
  account,
  onChangeEmail,
  onLogin,
  onWithdraw,
  onNotice,
}: {
  nickname: string
  look: AvatarLook
  faceImage?: string
  onSave: (patch: { nickname: string; look: AvatarLook; faceImage?: string }) => void
  onBack: () => void
  account: { loggedIn: boolean; loginProvider?: SocialProvider; accountEmail?: string }
  onChangeEmail: (email: string) => void
  onLogin: () => void
  onWithdraw: () => void
  onNotice: (message: string) => void
}) {
  // 계정 관리의 이메일·비밀번호 바꾸기 화면 (위에서 고치던 내용은 그대로 남는다)
  const [view, setView] = useState<AccountView>('main')
  const [name, setName] = useState(nickname)
  const [nextLook, setNextLook] = useState(look)
  const [nextFace, setNextFace] = useState(faceImage)
  const trimmed = name.trim()
  // 한글·이모지도 한 글자로 세도록 문자 단위로 센다
  const length = [...trimmed].length
  const tooLong = length > NICKNAME_MAX
  const changed =
    trimmed !== nickname ||
    nextLook.gender !== look.gender ||
    nextLook.style !== look.style ||
    nextFace !== faceImage
  const canSave = length > 0 && !tooLong && changed

  function submit(event: FormEvent) {
    event.preventDefault()
    if (canSave) onSave({ nickname: trimmed, look: nextLook, faceImage: nextFace })
  }

  if (view === 'email') {
    return (
      <EmailChange
        currentEmail={account.accountEmail}
        onChange={onChangeEmail}
        onNotice={onNotice}
        onBack={() => setView('main')}
      />
    )
  }
  if (view === 'password') return <PasswordChange onBack={() => setView('main')} />

  return (
    <section className="utility-screen profile-edit-screen">
      <SubpageHeader title="개인정보 고치기" subtitle="닉네임, 모습, 얼굴 사진을 바꿔요" onBack={onBack} />
      <form onSubmit={submit}>
        <div className="profile-edit-preview">
          <CharacterAvatar look={nextLook} label="내 아바타 미리보기" />
        </div>
        <div className="settings-group">
          <div className="settings-group-title">
            <span>닉네임과 모습</span>
          </div>
          <div className="profile-edit-panel">
            <label className="field">
              <span className="field-label-row">
                닉네임
                <em className={tooLong ? 'over' : ''} aria-live="polite">
                  {length}/{NICKNAME_MAX}
                </em>
              </span>
              <input
                maxLength={NICKNAME_MAX * 2}
                placeholder="작은 탐험가"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {tooLong && (
                <FieldHint ok={false}>{`닉네임은 ${NICKNAME_MAX}글자까지 쓸 수 있어요.`}</FieldHint>
              )}
              {length === 0 && <FieldHint ok={false}>닉네임을 적어 주세요.</FieldHint>}
            </label>
            <LookFields look={nextLook} onChange={setNextLook} />
          </div>
        </div>
        <div className="settings-group">
          <div className="settings-group-title">
            <span>얼굴 사진</span>
            <small>학습 영상 장면 속 내 캐릭터 얼굴에만 쓰여요.</small>
          </div>
          <div className="profile-edit-panel face-panel">
            <FacePhotoField faceImage={nextFace} onChange={setNextFace} />
          </div>
        </div>
        <ActionButton
          onClick={() => canSave && onSave({ nickname: trimmed, look: nextLook, faceImage: nextFace })}
          disabled={!canSave}
        >
          저장
        </ActionButton>
      </form>
      <AccountSection
        loggedIn={account.loggedIn}
        loginProvider={account.loginProvider}
        accountEmail={account.accountEmail}
        onOpen={setView}
        onLogin={onLogin}
        onWithdraw={onWithdraw}
      />
    </section>
  )
}
