import { useState } from 'react'
import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { FieldHint } from './AuthHeader'
import { SubpageHeader } from './SubpageHeader'
import { isEmail, PASSWORD_MIN } from '../lib/validate'
import { PROVIDER_NAME } from '../screens/SignupScreen'
import type { SocialProvider } from '../types'

// 설정 > 개인정보 고치기 > 계정 관리 (서버가 없어서 화면과 흐름만)
// - 이메일 가입: 이메일 바꾸기(인증번호 6자리), 비밀번호 바꾸기
// - 간편 로그인: "○○ 계정으로 로그인 중이에요"
// - 먼저 둘러보기: 로그인 안내
// - 회원 탈퇴: 확인 창 → 저장된 기록을 지우고 처음 화면으로
// 비밀번호와 인증번호는 화면 안에서 확인에만 쓰고 어디에도 저장하지 않는다.

export type AccountView = 'main' | 'email' | 'password'

export function AccountSection({
  loggedIn,
  loginProvider,
  accountEmail,
  onOpen,
  onLogin,
  onWithdraw,
}: {
  loggedIn: boolean
  loginProvider?: SocialProvider
  accountEmail?: string
  onOpen: (view: Exclude<AccountView, 'main'>) => void
  onLogin: () => void
  onWithdraw: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="settings-group account-section">
      <div className="settings-group-title">
        <span>계정 관리</span>
      </div>
      {!loggedIn ? (
        <div className="profile-edit-panel account-guest">
          <p>로그인하면 이메일과 비밀번호를 바꿀 수 있어요.</p>
          <ActionButton onClick={onLogin}>로그인</ActionButton>
        </div>
      ) : loginProvider ? (
        <div className="profile-edit-panel account-social">
          <span className="settings-icon">
            <Icon name="user" size={20} />
          </span>
          <div>
            <strong>{PROVIDER_NAME[loginProvider]} 계정으로 로그인 중이에요</strong>
            <span>이메일과 비밀번호는 {PROVIDER_NAME[loginProvider]}에서 바꿀 수 있어요.</span>
          </div>
        </div>
      ) : (
        <div className="account-rows">
          <button type="button" className="settings-row push-setting" onClick={() => onOpen('email')}>
            <span className="settings-icon">
              <Icon name="edit" size={20} />
            </span>
            <div>
              <strong>이메일 바꾸기</strong>
              <span>{accountEmail ? `지금 이메일: ${accountEmail}` : '새 이메일로 바꿔요'}</span>
            </div>
            <Icon name="chevron" size={18} />
          </button>
          <button type="button" className="settings-row push-setting" onClick={() => onOpen('password')}>
            <span className="settings-icon">
              <Icon name="lock" size={20} />
            </span>
            <div>
              <strong>비밀번호 바꾸기</strong>
              <span>{`${PASSWORD_MIN}글자 이상으로 바꿔요`}</span>
            </div>
            <Icon name="chevron" size={18} />
          </button>
        </div>
      )}
      {loggedIn && (
        <button type="button" className="withdraw-button" onClick={() => setConfirmOpen(true)}>
          회원 탈퇴
        </button>
      )}
      {confirmOpen && (
        <div className="modal-layer" onClick={() => setConfirmOpen(false)}>
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="withdraw-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="withdraw-title">정말 탈퇴할까요?</h2>
            <p>
              <b>학습 기록과 아바타가 모두 지워져요.</b>
              <br />
              지운 기록은 다시 되돌릴 수 없어요.
            </p>
            <ActionButton className="danger" onClick={onWithdraw}>
              탈퇴하기
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setConfirmOpen(false)}>
              그만두기
            </ActionButton>
          </section>
        </div>
      )}
    </div>
  )
}

/** 이메일 바꾸기: 새 이메일 → 인증 메일 → 인증번호 6자리 → 완료 */
export function EmailChange({
  currentEmail,
  onChange,
  onNotice,
  onBack,
}: {
  currentEmail?: string
  onChange: (email: string) => void
  onNotice: (message: string) => void
  onBack: () => void
}) {
  const [step, setStep] = useState<'input' | 'code' | 'done'>('input')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const trimmed = email.trim()
  const emailOk = isEmail(trimmed)
  const same = emailOk && trimmed.toLowerCase() === currentEmail?.trim().toLowerCase()
  const codeOk = /^\d{6}$/.test(code)

  if (step === 'done') {
    return (
      <section className="utility-screen profile-edit-screen">
        <SubpageHeader title="이메일 바꾸기" subtitle="새 이메일로 로그인해요" onBack={onBack} />
        <div className="login-panel auth-done" role="status">
          <span className="auth-done-icon">
            <Icon name="check" size={30} />
          </span>
          <h1>이메일을 바꿨어요</h1>
          <p>
            이제 <b>{trimmed}</b>로 로그인해요.
          </p>
          <ActionButton onClick={onBack}>돌아가기</ActionButton>
        </div>
      </section>
    )
  }

  if (step === 'code') {
    return (
      <section className="utility-screen profile-edit-screen">
        <SubpageHeader title="이메일 바꾸기" subtitle="인증번호를 확인해요" onBack={() => setStep('input')} />
        <div className="profile-edit-panel">
          <div className="auth-info">
            <Icon name="bell" size={20} />
            <p>
              <b>인증 메일을 보냈어요.</b>
              <br />
              {trimmed}로 보낸 인증번호 6자리를 적어 주세요.
            </p>
          </div>
          <label className="field">
            <span>인증번호</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="숫자 6자리"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            {code &&
              (codeOk ? (
                <FieldHint ok>좋아요!</FieldHint>
              ) : (
                <FieldHint ok={false}>{`숫자 6자리를 모두 적어 주세요. (지금 ${code.length}자리)`}</FieldHint>
              ))}
          </label>
          <ActionButton
            onClick={() => {
              if (!codeOk) return
              onChange(trimmed)
              setStep('done')
            }}
            disabled={!codeOk}
          >
            확인
          </ActionButton>
          <button type="button" className="text-link" onClick={() => onNotice('인증 메일을 다시 보냈어요')}>
            인증 메일 다시 보내기
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="utility-screen profile-edit-screen">
      <SubpageHeader title="이메일 바꾸기" subtitle="새 이메일로 인증 메일을 보내요" onBack={onBack} />
      <div className="profile-edit-panel">
        {currentEmail && <p className="account-current">지금 이메일: {currentEmail}</p>}
        <label className="field">
          <span>새 이메일</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="hello@history.kr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {email &&
            (!emailOk ? (
              <FieldHint ok={false}>이메일 모양이 맞지 않아요. (예: hello@history.kr)</FieldHint>
            ) : same ? (
              <FieldHint ok={false}>지금 쓰고 있는 이메일이에요.</FieldHint>
            ) : (
              <FieldHint ok>좋아요!</FieldHint>
            ))}
        </label>
        <ActionButton
          onClick={() => {
            if (!emailOk || same) return
            setCode('')
            setStep('code')
          }}
          disabled={!emailOk || same}
        >
          인증 메일 보내기
        </ActionButton>
      </div>
    </section>
  )
}

/** 비밀번호 바꾸기: 지금 비밀번호, 새 비밀번호(8자 이상), 새 비밀번호 확인 → 완료. 아무것도 저장하지 않는다 */
export function PasswordChange({ onBack }: { onBack: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const nextLongEnough = next.length >= PASSWORD_MIN
  const nextDifferent = next !== current
  const nextOk = nextLongEnough && nextDifferent
  const confirmOk = confirm.length > 0 && confirm === next
  const canSave = current.length > 0 && nextOk && confirmOk

  if (done) {
    return (
      <section className="utility-screen profile-edit-screen">
        <SubpageHeader title="비밀번호 바꾸기" subtitle="새 비밀번호로 로그인해요" onBack={onBack} />
        <div className="login-panel auth-done" role="status">
          <span className="auth-done-icon">
            <Icon name="check" size={30} />
          </span>
          <h1>비밀번호를 바꿨어요</h1>
          <p>다음에 로그인할 때 새 비밀번호를 써 주세요.</p>
          <ActionButton onClick={onBack}>돌아가기</ActionButton>
        </div>
      </section>
    )
  }

  return (
    <section className="utility-screen profile-edit-screen">
      <SubpageHeader
        title="비밀번호 바꾸기"
        subtitle={`새 비밀번호는 ${PASSWORD_MIN}글자 이상`}
        onBack={onBack}
      />
      <div className="profile-edit-panel">
        <label className="field">
          <span>지금 비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="지금 쓰는 비밀번호"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </label>
        <label className="field">
          <span>새 비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN}글자 이상 적어 주세요`}
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
          {next &&
            (!nextLongEnough ? (
              <FieldHint
                ok={false}
              >{`비밀번호는 ${PASSWORD_MIN}글자 이상이어야 해요. (지금 ${next.length}글자)`}</FieldHint>
            ) : !nextDifferent ? (
              <FieldHint ok={false}>지금 비밀번호와 다른 비밀번호를 적어 주세요.</FieldHint>
            ) : (
              <FieldHint ok>좋아요!</FieldHint>
            ))}
        </label>
        <label className="field">
          <span>새 비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="새 비밀번호를 한 번 더 적어 주세요"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          {confirm &&
            (confirmOk ? (
              <FieldHint ok>두 비밀번호가 같아요.</FieldHint>
            ) : (
              <FieldHint ok={false}>두 비밀번호가 달라요.</FieldHint>
            ))}
        </label>
        <ActionButton
          onClick={() => {
            if (!canSave) return
            // 서버가 없어 실제로 바꾸지는 않는다. 입력한 비밀번호는 화면을 떠나면 사라진다.
            setCurrent('')
            setNext('')
            setConfirm('')
            setDone(true)
          }}
          disabled={!canSave}
        >
          비밀번호 바꾸기
        </ActionButton>
      </div>
    </section>
  )
}
