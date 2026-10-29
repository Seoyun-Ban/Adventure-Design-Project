import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { AuthHeader, AuthLayout, FieldHint } from '../components/AuthHeader'
import { isEmail } from '../lib/validate'

// 비밀번호 찾기 (프로토타입: 실제로 메일을 보내지 않고 화면과 흐름만)
// 이메일 입력 → "재설정 링크를 보냈어요" 안내 → 로그인 화면으로 돌아가기
export function ResetPasswordScreen({
  initialEmail = '',
  onBack,
}: {
  initialEmail?: string
  onBack: () => void
}) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)
  const emailOk = isEmail(email)

  if (sent) {
    return (
      <AuthLayout>
        <section className="login-panel auth-done">
          <span className="auth-done-icon">
            <Icon name="check" size={30} />
          </span>
          <h1>재설정 링크를 보냈어요</h1>
          <p>
            <b className="break-anywhere">{email.trim()}</b>
            <br />
            메일함에서 링크를 눌러 새 비밀번호를 만들어 주세요.
          </p>
          <p className="auth-note">메일이 보이지 않으면 스팸함도 확인해 주세요.</p>
          <ActionButton onClick={onBack}>로그인 화면으로 돌아가기</ActionButton>
        </section>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="비밀번호 찾기"
        subtitle="가입한 이메일로 비밀번호 재설정 링크를 보내드려요."
        onBack={onBack}
      />
      <section className="login-panel">
        <label className="field">
          <span>이메일</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="hello@history.kr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {email && !emailOk && (
            <FieldHint ok={false}>이메일 형식으로 입력해 주세요. (예: hello@history.kr)</FieldHint>
          )}
        </label>
        <ActionButton onClick={() => emailOk && setSent(true)} disabled={!emailOk}>
          재설정 링크 보내기
        </ActionButton>
      </section>
    </AuthLayout>
  )
}
