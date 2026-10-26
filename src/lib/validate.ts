// 입력값 검사 (회원가입·비밀번호 찾기). 서버가 없어서 형식만 확인한다.

/** 이메일 형식인지 (예: name@example.com) */
export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** 비밀번호 최소 글자 수 */
export const PASSWORD_MIN = 8
