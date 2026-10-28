import { useState } from 'react'
import { Icon } from './Icon'
import type { LocationStatus, MyPosition } from '../hooks/useLocation'
import { inAppBrowserName, isAndroid, isAppleMobile, POOR_ACCURACY_M } from '../lib/location'

// 지도 위 위치 안내 한 줄: 위치가 꺼져 있거나, 막혔거나, 정확하지 않을 때 쉬운 말로 알려준다.
// 어떤 경우에도 지도는 그대로 쓸 수 있다. 닫기(×)를 누르면 이번에 앱을 쓰는 동안은 숨긴다.
export function LocationNotice({
  status,
  position,
  onStart,
}: {
  status: LocationStatus
  position: MyPosition | null
  onStart: () => void
}) {
  const [hidden, setHidden] = useState<string | null>(null)
  const message = noticeFor(status, position)
  if (!message || hidden === message.key) return null

  return (
    <div className={`location-notice ${message.tone}`} role="status">
      <span className="location-notice-icon">
        <Icon name={message.tone === 'info' ? 'locate' : 'help'} size={18} />
      </span>
      <div>
        <strong>{message.title}</strong>
        {message.body && <p>{message.body}</p>}
        {message.action && (
          <button type="button" className="location-notice-action" onClick={onStart}>
            {message.action}
          </button>
        )}
      </div>
      <button
        type="button"
        className="notification-close"
        onClick={() => setHidden(message.key)}
        aria-label="안내 닫기"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

type Notice = { key: string; tone: 'info' | 'warn'; title: string; body?: string; action?: string }

function noticeFor(status: LocationStatus, position: MyPosition | null): Notice | null {
  const inApp = inAppBrowserName()
  const otherBrowser = `${inApp ?? '이 앱'} 안에서는 위치를 쓸 수 없어요. 메뉴(⋮ 또는 공유 버튼)에서 ‘다른 브라우저로 열기’를 눌러 주세요.`

  switch (status) {
    case 'off':
      return {
        key: 'off',
        tone: 'info',
        title: '위치를 켜면 가까운 역사 장소가 열려요',
        body: '정확한 위치는 저장하지 않아요. 방문한 장소만 기억해요.',
        action: '위치 켜기',
      }
    case 'locating':
      return { key: 'locating', tone: 'info', title: '내 위치를 찾고 있어요…' }
    case 'unsupported':
      return inApp
        ? { key: 'unsupported', tone: 'warn', title: '다른 브라우저로 열어 주세요', body: otherBrowser }
        : {
            key: 'unsupported',
            tone: 'warn',
            title: '이 주소에서는 위치를 쓸 수 없어요',
            body: 'https로 시작하는 주소로 열어 주세요. 지도는 그대로 볼 수 있어요.',
          }
    case 'denied':
      if (inApp)
        return { key: 'denied', tone: 'warn', title: '다른 브라우저로 열어 주세요', body: otherBrowser }
      return {
        key: 'denied',
        tone: 'warn',
        title: '위치 사용을 허락하지 않았어요',
        body: isAppleMobile()
          ? '지도는 그대로 볼 수 있어요. 다시 켜려면 주소창의 ‘가가(aA)’ 버튼 → 웹 사이트 설정 → 위치 → 허용을 눌러 주세요.'
          : '지도는 그대로 볼 수 있어요. 다시 켜려면 주소창 왼쪽의 자물쇠(또는 설정) 버튼 → 위치 → 허용을 눌러 주세요.',
        action: '다시 시도',
      }
    case 'unavailable':
      return {
        key: 'unavailable',
        tone: 'warn',
        title: inApp ? '다른 브라우저로 열어 주세요' : '지금은 위치를 찾을 수 없어요',
        body: inApp
          ? otherBrowser
          : '휴대폰의 위치(GPS)가 켜져 있는지 확인하고, 건물 밖에서 다시 해 봐요. 지도는 그대로 볼 수 있어요.',
        action: '다시 시도',
      }
    case 'on':
      if (!position || position.accuracy <= POOR_ACCURACY_M) return null
      return {
        key: 'poor',
        tone: 'warn',
        title: '위치가 정확하지 않아요',
        body: isAppleMobile()
          ? '아이폰의 ‘설정’ → ‘개인정보 보호 및 보안’ → ‘위치 서비스’ → ‘Safari 웹 사이트’에서 ‘정확한 위치’를 켜 주세요.'
          : isAndroid()
            ? '휴대폰 ‘설정’ → ‘위치’에서 위치를 켜고 ‘위치 정확도 개선’도 켜 주세요. 건물 밖에서 더 정확해요.'
            : '컴퓨터는 위치가 정확하지 않을 수 있어요. 휴대폰으로 열면 더 정확해요.',
      }
  }
}
