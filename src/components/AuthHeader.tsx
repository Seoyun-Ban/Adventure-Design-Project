import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** 회원가입·비밀번호 찾기 화면 바탕 (로그인 화면과 같은 배경) */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-screen screen auth-screen">
      <div className="paper-grain" />
      {children}
    </main>
  )
}

/** 회원가입·비밀번호 찾기 화면 위쪽: 뒤로 가기 + 제목 (로그인 화면과 같은 분위기) */
export function AuthHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle?: string
  onBack: () => void
}) {
  return (
    <header className="auth-head">
      <button className="icon-button plain auth-back" type="button" onClick={onBack} aria-label="뒤로 가기">
        <Icon name="arrow" />
      </button>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}

/** 입력칸 아래 안내 문구. ok가 true면 초록, false면 빨강 */
export function FieldHint({ ok, children }: { ok: boolean; children: string }) {
  return (
    <small className={`field-hint ${ok ? 'ok' : 'error'}`} role={ok ? undefined : 'alert'}>
      {children}
    </small>
  )
}
