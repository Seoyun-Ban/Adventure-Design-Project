import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { AuthHeader, AuthLayout, FieldHint } from '../components/AuthHeader'
import { isEmail, PASSWORD_MIN } from '../lib/validate'

// 회원가입 (프로토타입: 서버 없이 화면과 흐름만)
// 1) 정보 입력 + 약관 동의 → 2) 만 14세 미만이면 보호자 동의 → 3) 가입 완료 → 온보딩
// 비밀번호와 보호자 이메일은 입력 확인에만 쓰고 어디에도 저장하지 않는다.
// 만 14세 미만 아동의 개인정보를 처리하려면 개인정보 보호법에 따라 법정대리인(보호자)의 동의가 필요하다.

type Step = 'form' | 'guardian' | 'done'
type TermId = 'service' | 'privacy'

// 약관 예시 문구 (실제 서비스 전에 정식 약관으로 바꿔야 한다)
const terms: { id: TermId; title: string; body: string }[] = [
  {
    id: 'service',
    title: '이용약관 동의',
    body: '예시 문구입니다. 역사 한걸음은 역사 유적지 학습과 퀴즈, 아바타 꾸미기 기능을 제공합니다. 회원은 다른 사람의 정보를 도용하거나 서비스 운영을 방해해서는 안 됩니다. 회원은 언제든지 탈퇴할 수 있습니다.',
  },
  {
    id: 'privacy',
    title: '개인정보 수집·이용 동의',
    body: '예시 문구입니다. 수집 항목: 이메일, 닉네임, 비밀번호 / 이용 목적: 회원 식별, 학습 기록 저장 / 보유 기간: 회원 탈퇴 시까지. 동의를 거부할 수 있으나, 이 경우 회원가입을 할 수 없습니다.',
  },
]

export function SignupScreen({ onBack, onDone }: { onBack: () => void; onDone: (nickname: string) => void }) {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [under14, setUnder14] = useState<boolean | null>(null)
  const [agreed, setAgreed] = useState<Record<TermId, boolean>>({ service: false, privacy: false })
  const [openTerm, setOpenTerm] = useState<TermId | null>(null)
  const [guardianEmail, setGuardianEmail] = useState('')

  const emailOk = isEmail(email)
  const passwordOk = password.length >= PASSWORD_MIN
  const confirmOk = confirm.length > 0 && confirm === password
  const nicknameOk = nickname.trim().length > 0
  const allAgreed = agreed.service && agreed.privacy
  const formOk = emailOk && passwordOk && confirmOk && nicknameOk && under14 !== null && allAgreed
  const guardianOk = isEmail(guardianEmail) && guardianEmail.trim() !== email.trim()

  function submitForm() {
    if (!formOk) return
    setStep(under14 ? 'guardian' : 'done')
  }

  if (step === 'done') {
    return (
      <AuthLayout>
        <section className="login-panel auth-done">
          <span className="auth-done-icon">
            <Icon name="check" size={30} />
          </span>
          <h1>가입이 완료됐어요</h1>
          <p>
            {nickname.trim()}님, 반가워요!
            <br />
            이제 함께 역사 여행을 떠날 아바타를 만들어요.
          </p>
          {under14 && (
            <p className="auth-note">
              보호자 이메일로 동의 요청을 보냈어요. 실제 서비스에서는 보호자가 동의해야 이용할 수 있어요.
              (프로토타입에서는 바로 시작해요.)
            </p>
          )}
          <ActionButton onClick={() => onDone(nickname.trim())}>
            아바타 만들러 가기 <Icon name="chevron" size={18} />
          </ActionButton>
        </section>
      </AuthLayout>
    )
  }

  if (step === 'guardian') {
    return (
      <AuthLayout>
        <AuthHeader
          title="보호자 동의"
          subtitle="만 14세 미만 어린이는 보호자의 동의가 필요해요."
          onBack={() => setStep('form')}
        />
        <section className="login-panel">
          <div className="auth-info">
            <Icon name="user" size={20} />
            <p>
              개인정보 보호법에 따라 만 14세 미만 어린이가 가입하려면 보호자(법정대리인)의 동의가 필요해요.
              보호자 이메일로 동의 요청을 보낼게요.
            </p>
          </div>
          <label className="field">
            <span>보호자 이메일</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="parent@example.com"
              value={guardianEmail}
              onChange={(event) => setGuardianEmail(event.target.value)}
            />
            {guardianEmail &&
              (!isEmail(guardianEmail) ? (
                <FieldHint ok={false}>이메일 형식으로 입력해 주세요. (예: parent@example.com)</FieldHint>
              ) : guardianEmail.trim() === email.trim() ? (
                <FieldHint ok={false}>내 이메일과 다른 보호자 이메일을 입력해 주세요.</FieldHint>
              ) : (
                <FieldHint ok>좋아요!</FieldHint>
              ))}
          </label>
          <ActionButton onClick={() => guardianOk && setStep('done')} disabled={!guardianOk}>
            동의 요청 보내고 가입하기
          </ActionButton>
        </section>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeader title="회원가입" subtitle="역사 탐험을 시작할 계정을 만들어요." onBack={onBack} />
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
          {email &&
            (emailOk ? (
              <FieldHint ok>사용할 수 있는 형식이에요.</FieldHint>
            ) : (
              <FieldHint ok={false}>이메일 형식으로 입력해 주세요. (예: hello@history.kr)</FieldHint>
            ))}
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN}자 이상 입력하세요`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {password &&
            (passwordOk ? (
              <FieldHint ok>안전한 길이예요.</FieldHint>
            ) : (
              <FieldHint
                ok={false}
              >{`${PASSWORD_MIN}자 이상 입력해 주세요. (지금 ${password.length}자)`}</FieldHint>
            ))}
        </label>
        <label className="field">
          <span>비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 한 번 더 입력하세요"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          {confirm &&
            (confirmOk ? (
              <FieldHint ok>비밀번호가 같아요.</FieldHint>
            ) : (
              <FieldHint ok={false}>비밀번호가 서로 달라요.</FieldHint>
            ))}
        </label>
        <label className="field">
          <span>닉네임</span>
          <input
            maxLength={10}
            placeholder="작은 탐험가"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>

        <div className="option-row auth-age">
          <span>만 14세 미만인가요?</span>
          <div className="settings-segments">
            {[
              { value: true, label: '네, 14세 미만이에요' },
              { value: false, label: '아니요' },
            ].map((option) => (
              <button
                type="button"
                key={option.label}
                className={under14 === option.value ? 'active' : ''}
                onClick={() => setUnder14(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="terms-box">
          <label className="checkbox terms-all">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={() => setAgreed({ service: !allAgreed, privacy: !allAgreed })}
            />
            <span className="check-ui">
              <Icon name="check" size={13} />
            </span>
            전체 동의
          </label>
          {terms.map((term) => (
            <div key={term.id} className="terms-item">
              <div className="terms-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={agreed[term.id]}
                    onChange={() => setAgreed({ ...agreed, [term.id]: !agreed[term.id] })}
                  />
                  <span className="check-ui">
                    <Icon name="check" size={13} />
                  </span>
                  {term.title} <b>(필수)</b>
                </label>
                <button
                  type="button"
                  className="text-link"
                  aria-expanded={openTerm === term.id}
                  onClick={() => setOpenTerm(openTerm === term.id ? null : term.id)}
                >
                  {openTerm === term.id ? '닫기' : '보기'}
                </button>
              </div>
              {openTerm === term.id && <p className="terms-text">{term.body}</p>}
            </div>
          ))}
        </div>

        <ActionButton onClick={submitForm} disabled={!formOk}>
          {under14 ? '다음' : '가입하기'}
        </ActionButton>
        {!formOk && <p className="auth-note">모든 항목을 입력하고 필수 약관에 동의하면 가입할 수 있어요.</p>}
      </section>
    </AuthLayout>
  )
}
