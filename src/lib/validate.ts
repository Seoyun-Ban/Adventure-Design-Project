// 입력값 검사 (회원가입·비밀번호 찾기). 서버가 없어서 형식만 확인한다.

/** 이메일 형식인지 (예: name@example.com) */
export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** 비밀번호 최소 글자 수 */
export const PASSWORD_MIN = 8

/** 이 나이보다 어리면 보호자(법정대리인) 동의가 필요하다 (개인정보 보호법: 만 14세 미만) */
export const GUARDIAN_AGE = 14

/**
 * 태어난 해·달로 만 나이를 계산한다.
 * 태어난 날(일)은 모르므로, 생일이 있는 달에는 아직 생일이 지나지 않은 것으로 본다.
 * (만 14세가 되는 달의 어린이는 보호자 동의를 받도록, 어린이를 보호하는 쪽으로 판단)
 */
export function ageFromBirth(year: number, month: number, today = new Date()) {
  const thisYear = today.getFullYear()
  const thisMonth = today.getMonth() + 1
  return thisYear - year - (thisMonth <= month ? 1 : 0)
}

/** 아직 오지 않은 해·달인지 */
export function isFutureMonth(year: number, month: number, today = new Date()) {
  return year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)
}
