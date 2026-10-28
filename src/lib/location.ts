// 위치 기능에서 쓰는 판단 (기기·브라우저 종류, 위치 정확도)

/** 위치 오차가 이보다 작아야 '장소에 왔다'고 판단한다 (m) */
export const UNLOCK_ACCURACY_M = 300
/** 위치 오차가 이보다 크면 '위치가 정확하지 않아요' 안내를 보여준다 (m) */
export const POOR_ACCURACY_M = 1000

/**
 * 카카오톡·네이버·인스타그램 같은 앱 안에서 열린 브라우저인지 (위치 기능이 막히는 경우가 많다)
 * 앱 이름을 돌려주고, 일반 브라우저면 null
 */
export function inAppBrowserName(userAgent = navigator.userAgent): string | null {
  const apps: [RegExp, string][] = [
    [/KAKAOTALK/i, '카카오톡'],
    [/NAVER\(inapp|NAVER/i, '네이버 앱'],
    [/Instagram/i, '인스타그램'],
    [/FBAN|FBAV|FB_IAB/i, '페이스북'],
    [/\bLine\//i, '라인'],
    [/DaumApps/i, '다음 앱'],
    [/everytimeApp/i, '에브리타임'],
    [/BAND\//i, '밴드'],
  ]
  return apps.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null
}

/** 아이폰·아이패드인지 (아이패드는 컴퓨터처럼 보이는 경우도 함께 확인) */
export function isAppleMobile(userAgent = navigator.userAgent) {
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
}

/** 안드로이드인지 */
export function isAndroid(userAgent = navigator.userAgent) {
  return /Android/i.test(userAgent)
}

/** 이 주소·브라우저에서 위치 기능을 쓸 수 있는지 (https 또는 localhost에서만 된다) */
export function canUseLocation() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator && window.isSecureContext
}
