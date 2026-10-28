import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { inAppBrowserName } from '../lib/location'

// 위치 권한을 묻기 전에 보여주는 설명 화면 (처음 지도에 들어갈 때 한 번)
// '위치 켜기'를 누르면 그다음에 브라우저가 위치 허용 여부를 묻는다.
export function LocationIntro({ onAllow, onLater }: { onAllow: () => void; onLater: () => void }) {
  const inApp = inAppBrowserName()
  return (
    <div
      className="location-intro-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-intro-title"
    >
      <section className="location-intro">
        <span className="location-intro-icon">
          <Icon name="locate" size={34} />
        </span>
        <h2 id="location-intro-title">내 위치를 켜 볼까요?</h2>
        <ul>
          <li>
            <Icon name="footprint" size={18} />
            <span>
              역사 장소에 가까이(<b>500m 안</b>) 가면 그 장소의 이야기가 열려요.
            </span>
          </li>
          <li>
            <Icon name="lock" size={18} />
            <span>
              <b>정확한 위치는 저장하지 않아요.</b> 방문한 장소만 기억해요.
            </span>
          </li>
          <li>
            <Icon name="map" size={18} />
            <span>앱을 보고 있을 때만 위치를 써요.</span>
          </li>
          <li>
            <Icon name="check" size={18} />
            <span>다음에 나오는 창에서 ‘허용’을 눌러 주세요. 부모님과 함께 눌러도 좋아요.</span>
          </li>
        </ul>
        {inApp && (
          <p className="location-inapp">
            지금은 {inApp} 안에서 열려 있어서 위치를 쓸 수 없을 수 있어요. 화면 위나 아래의 메뉴(⋮ 또는 공유
            버튼)에서 ‘다른 브라우저로 열기’를 눌러 주세요.
          </p>
        )}
        <ActionButton onClick={onAllow}>
          <Icon name="locate" size={18} /> 위치 켜기
        </ActionButton>
        <ActionButton variant="ghost" onClick={onLater}>
          나중에 할게요
        </ActionButton>
      </section>
    </div>
  )
}
