import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { AuthHeader, AuthLayout, FieldHint } from '../components/AuthHeader'
import { ageFromBirth, GUARDIAN_AGE, isEmail, isFutureMonth, PASSWORD_MIN } from '../lib/validate'
import { withJosa } from '../lib/korean'
import type { SocialProvider } from '../types'

// 회원가입 (프로토타입: 서버 없이 화면과 흐름만)
// 1) 정보 입력 + 태어난 해·달 + 약관 동의 → 2) 만 14세 미만이면 보호자 허락 → 3) 가입 완료 → 온보딩
// 이메일 가입과 간편 로그인(provider) 첫 가입이 같은 흐름을 쓴다. 간편 로그인은 이메일·비밀번호 칸만 없다.
// 만 14세 미만 아동의 개인정보를 처리하려면 개인정보 보호법에 따라 법정대리인(보호자)의 동의가 필요하다.
// 비밀번호, 태어난 해·달, 보호자 이메일은 화면 안에서 확인·판단에만 쓰고 어디에도 저장하지 않는다.

type Step = 'form' | 'guardian' | 'done'
type TermId = 'service' | 'privacy'

/** 간편 로그인 회사 이름 (가입 화면, 계정 관리) */
export const PROVIDER_NAME: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
}

// 약관 예시 문구 (실제 서비스 전에 정식 약관으로 바꿔야 한다). summary는 초등학생용 '쉽게 읽는 요약' 세 줄
function termsFor(
  provider?: SocialProvider,
): { id: TermId; title: string; summary: string[]; body: string }[] {
  return [
    {
      id: 'service',
      title: '이용약관',
      summary: [
        '역사 장소를 배우고 퀴즈를 풀 수 있어요.',
        '다른 사람인 척하거나 서비스를 방해하면 안 돼요.',
        '그만 쓰고 싶으면 언제든지 탈퇴할 수 있어요.',
      ],
      body: '역사 한걸음은 역사 유적지 학습과 퀴즈, 아바타 꾸미기 기능을 제공합니다. 회원은 다른 사람의 정보를 도용하거나 서비스 운영을 방해해서는 안 됩니다. 회원은 언제든지 탈퇴할 수 있습니다.',
    },
    {
      id: 'privacy',
      title: '개인정보 수집·이용',
      summary: [
        provider
          ? `${PROVIDER_NAME[provider]}에서 받은 이메일과 내가 정한 닉네임을 받아요.`
          : '이메일, 비밀번호, 닉네임을 받아요.',
        '나를 알아보고 학습 기록을 저장하는 데만 써요.',
        '탈퇴하면 지워요. 동의하지 않으면 가입할 수 없어요.',
      ],
      body: provider
        ? `수집 항목: ${PROVIDER_NAME[provider]} 계정의 이메일, 닉네임 / 이용 목적: 회원 식별, 학습 기록 저장 / 보유 기간: 회원 탈퇴 시까지. 동의를 거부할 수 있으나, 이 경우 회원가입을 할 수 없습니다.`
        : '수집 항목: 이메일, 닉네임, 비밀번호 / 이용 목적: 회원 식별, 학습 기록 저장 / 보유 기간: 회원 탈퇴 시까지. 동의를 거부할 수 있으나, 이 경우 회원가입을 할 수 없습니다.',
    },
  ]
}

const thisYear = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, index) => thisYear - index)
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

export function SignupScreen({
  provider,
  onBack,
  onDone,
}: {
  /** 간편 로그인으로 처음 들어온 경우 그 회사. 없으면 이메일 가입 */
  provider?: SocialProvider
  onBack: () => void
  /** email: 이메일 가입이면 계정 이메일 (간편 로그인은 없음). 비밀번호는 넘기지 않는다 */
  onDone: (nickname: string, email?: string) => void
}) {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [agreed, setAgreed] = useState<Record<TermId, boolean>>({ service: false, privacy: false })
  const [openTerm, setOpenTerm] = useState<TermId | null>(null)
  const [guardianEmail, setGuardianEmail] = useState('')
  const terms = termsFor(provider)

  const emailOk = isEmail(email)
  const passwordOk = password.length >= PASSWORD_MIN
  const confirmOk = confirm.length > 0 && confirm === password
  const accountOk = provider ? true : emailOk && passwordOk && confirmOk
  const nicknameOk = nickname.trim().length > 0
  const birthPicked = birthYear !== '' && birthMonth !== ''
  const birthFuture = birthPicked && isFutureMonth(Number(birthYear), Number(birthMonth))
  const age = birthPicked && !birthFuture ? ageFromBirth(Number(birthYear), Number(birthMonth)) : null
  const needsGuardian = age !== null && age < GUARDIAN_AGE
  const allAgreed = agreed.service && agreed.privacy
  const formOk = accountOk && nicknameOk && age !== null && allAgreed
  const guardianOk = isEmail(guardianEmail) && (provider || guardianEmail.trim() !== email.trim())

  function submitForm() {
    if (!formOk) return
    setStep(needsGuardian ? 'guardian' : 'done')
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
          {needsGuardian && (
            <div className="auth-info auth-guardian-wait">
              <Icon name="bell" size={20} />
              <p>
                보호자께 허락을 부탁하는 메일을 보냈어요.
                <br />
                <b>보호자가 허락하면 모든 기능을 쓸 수 있어요.</b>
              </p>
            </div>
          )}
          <ActionButton onClick={() => onDone(nickname.trim(), provider ? undefined : email.trim())}>
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
          title="부모님 허락 받기"
          subtitle="만 14살이 안 된 친구는 부모님이나 보호자의 허락이 필요해요."
          onBack={() => setStep('form')}
        />
        <section className="login-panel">
          <div className="auth-info">
            <Icon name="user" size={20} />
            <p>
              어린이의 정보를 지키는 약속(개인정보 보호법)에 따라, 만 14살이 안 된 친구가 가입하려면
              부모님이나 보호자의 허락이 필요해요. 보호자 이메일로 허락을 부탁하는 메일을 보낼게요.
            </p>
          </div>
          <label className="field">
            <span>부모님(보호자) 이메일</span>
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
                <FieldHint ok={false}>이메일 모양이 맞지 않아요. (예: parent@example.com)</FieldHint>
              ) : !provider && guardianEmail.trim() === email.trim() ? (
                <FieldHint ok={false}>내 이메일 말고 부모님(보호자) 이메일을 적어 주세요.</FieldHint>
              ) : (
                <FieldHint ok>좋아요!</FieldHint>
              ))}
          </label>
          <ActionButton onClick={() => guardianOk && setStep('done')} disabled={!guardianOk}>
            허락 요청 보내고 가입하기
          </ActionButton>
        </section>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeader
        title={provider ? `${withJosa(PROVIDER_NAME[provider], '으로')} 시작하기` : '회원가입'}
        subtitle={provider ? '처음 오셨네요! 몇 가지만 확인할게요.' : '역사 탐험을 시작할 계정을 만들어요.'}
        onBack={onBack}
      />
      <section className="login-panel">
        {!provider && (
          <>
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
                  <FieldHint ok>좋아요!</FieldHint>
                ) : (
                  <FieldHint ok={false}>이메일 모양이 맞지 않아요. (예: hello@history.kr)</FieldHint>
                ))}
            </label>
            <label className="field">
              <span>비밀번호</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={`${PASSWORD_MIN}글자 이상 적어 주세요`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {password &&
                (passwordOk ? (
                  <FieldHint ok>좋아요!</FieldHint>
                ) : (
                  <FieldHint
                    ok={false}
                  >{`비밀번호는 ${PASSWORD_MIN}글자 이상이어야 해요. (지금 ${password.length}글자)`}</FieldHint>
                ))}
            </label>
            <label className="field">
              <span>비밀번호 확인</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호를 한 번 더 적어 주세요"
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
          </>
        )}
        <label className="field">
          <span>닉네임</span>
          <input
            maxLength={10}
            placeholder="작은 탐험가"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>

        <div className="field">
          <span id="birth-label">태어난 해와 달</span>
          <div className="birth-row" role="group" aria-labelledby="birth-label">
            <select
              aria-label="태어난 해"
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
            >
              <option value="">년</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <select
              aria-label="태어난 달"
              value={birthMonth}
              onChange={(event) => setBirthMonth(event.target.value)}
            >
              <option value="">월</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </div>
          {birthFuture && <FieldHint ok={false}>아직 오지 않은 달이에요. 다시 골라 주세요.</FieldHint>}
          {age !== null &&
            (needsGuardian ? (
              <FieldHint
                ok
              >{`만 ${age}살이에요. 다음 단계에서 부모님이나 보호자의 허락을 받아요.`}</FieldHint>
            ) : (
              <FieldHint ok>{`만 ${age}살이에요.`}</FieldHint>
            ))}
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
            모두 동의해요
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
                  {term.title} <b>(꼭 필요)</b>
                </label>
                <button
                  type="button"
                  className="text-link"
                  aria-expanded={openTerm === term.id}
                  onClick={() => setOpenTerm(openTerm === term.id ? null : term.id)}
                >
                  {openTerm === term.id ? '닫기' : '전체 보기'}
                </button>
              </div>
              <div className="terms-summary">
                <strong>쉽게 읽는 요약</strong>
                <ul>
                  {term.summary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              {openTerm === term.id && <p className="terms-text">{term.body}</p>}
            </div>
          ))}
        </div>

        <ActionButton onClick={submitForm} disabled={!formOk}>
          {needsGuardian ? '다음' : '가입하기'}
        </ActionButton>
        {!formOk && (
          <p className="auth-note">빈칸을 모두 채우고 꼭 필요한 약관에 동의하면 가입할 수 있어요.</p>
        )}
      </section>
    </AuthLayout>
  )
}
