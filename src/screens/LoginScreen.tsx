import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'

export function LoginScreen({
  rememberedEmail,
  onEnter,
}: {
  rememberedEmail?: string
  /** loggedIn: 로그인 여부, email: '이메일 기억하기'가 켜져 있으면 저장할 이메일 */
  onEnter: (loggedIn: boolean, email?: string) => void
}) {
  const [remember, setRemember] = useState(Boolean(rememberedEmail))
  const [email, setEmail] = useState(rememberedEmail ?? '')
  const login = () => onEnter(true, remember ? email : undefined)
  return (
    <main className="login-screen screen">
      <div className="paper-grain" />
      <section className="login-top">
        <div className="brand-mark">
          <span className="brand-path" />
          <Icon name="footprint" size={34} />
        </div>
        <p className="eyebrow">걸어서 만나는 우리 역사</p>
        <h1>역사 한걸음</h1>
        <p className="login-intro">
          오늘의 발걸음이
          <br />
          내일의 이야기가 됩니다.
        </p>
      </section>

      <section className="login-panel">
        <p className="panel-title">간편하게 시작하기</p>
        <div className="social-row">
          <button className="social naver" onClick={login} type="button" aria-label="네이버로 로그인">
            N
          </button>
          <button className="social kakao" onClick={login} type="button" aria-label="카카오로 로그인">
            <span className="speech">•••</span>
          </button>
          <button className="social google" onClick={login} type="button" aria-label="구글로 로그인">
            G
          </button>
        </div>
        <div className="divider">
          <span>또는 이메일로</span>
        </div>
        <label className="field">
          <span>이메일</span>
          <input
            type="email"
            placeholder="hello@history.kr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input type="password" placeholder="비밀번호를 입력하세요" />
        </label>
        <div className="form-meta">
          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
            <span className="check-ui">
              <Icon name="check" size={13} />
            </span>
            이메일 기억하기
          </label>
          <button className="text-link" type="button">
            비밀번호 찾기
          </button>
        </div>
        <ActionButton onClick={login}>로그인</ActionButton>
        <p className="signup-copy">
          처음이신가요? <button type="button">회원가입</button>
        </p>
        <ActionButton onClick={() => onEnter(false)} variant="ghost" className="preview-button">
          먼저 둘러보기 <Icon name="chevron" size={18} />
        </ActionButton>
      </section>
    </main>
  )
}
