import { useState } from 'react'
import { Icon } from '../components/Icon'
import { KoreaMap } from '../components/KoreaMap'
import { PlaceItems } from '../components/PlaceItems'
import { places } from '../data/places'
import { placeContents } from '../data/contents'
import type { LearningRecord, Place } from '../types'

export function MapScreen({
  records,
  pushEnabled,
  favorites,
  onToggleFavorite,
  onLearn,
  onMenu,
}: {
  records: LearningRecord[]
  pushEnabled: boolean
  favorites: string[]
  onToggleFavorite: (placeId: string) => void
  onLearn: (place: Place) => void
  onMenu: () => void
}) {
  const [selected, setSelected] = useState<Place | null>(null)
  const [showFootprints, setShowFootprints] = useState(true)
  const [showAreas, setShowAreas] = useState(true)
  // 근처 장소 푸시 알림 연출 (TODO: 실제 위치 기반 500m 반경 판정)
  const [showPush, setShowPush] = useState(true)
  const selectedDone = selected ? records.some((record) => record.placeId === selected.id) : false
  const selectedThumb = selected ? placeContents[selected.id]?.heroImage : ''

  return (
    <section className="map-screen tab-screen">
      <div className="map-paper" />
      <header className="map-header">
        <button className="icon-button map-control" onClick={onMenu} type="button" aria-label="메뉴 열기">
          <Icon name="menu" />
        </button>
        <div className="map-heading">
          <span>오늘의 역사 산책</span>
          <strong>어디로 떠나볼까요?</strong>
        </div>
        <span className="map-header-spacer" aria-hidden="true" />
      </header>

      {pushEnabled && showPush && (
        <div className="nearby-notification">
          <button
            type="button"
            className="nearby-main"
            onClick={() => {
              setSelected(places.find((place) => place.id === 'independence') ?? null)
              setShowPush(false)
            }}
          >
            <span className="notification-icon">
              <Icon name="bell" size={19} />
            </span>
            <span>
              <strong>근처에 ‘독립기념관’이 있어요!</strong>
              <small>지금 역사를 만나보세요</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button
            type="button"
            className="notification-close"
            onClick={() => setShowPush(false)}
            aria-label="알림 닫기"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      <div className="map-viewport">
        <KoreaMap
          records={records}
          showFootprints={showFootprints}
          showAreas={showAreas}
          onSelect={setSelected}
        />
        <div className="compass">
          <span>N</span>
          <i />
        </div>
        <div className="map-legend">
          <button
            type="button"
            className={showFootprints ? 'active' : ''}
            onClick={() => setShowFootprints(!showFootprints)}
            aria-pressed={showFootprints}
          >
            <i className="foot-mini">
              <Icon name="footprint" size={12} />
            </i>
            발자국
          </button>
          <button
            type="button"
            className={showAreas ? 'active' : ''}
            onClick={() => setShowAreas(!showAreas)}
            aria-pressed={showAreas}
          >
            <i className="area-mini" />
            학습 가능 지역
          </button>
        </div>
      </div>

      <div className={`place-sheet ${selected ? 'show' : ''}`}>
        {selected && (
          <button
            className="place-card"
            type="button"
            onClick={() => selected.status !== 'locked' && onLearn(selected)}
          >
            <div className={`place-thumb ${selected.id}`}>
              {selectedThumb && selected.status !== 'locked' ? (
                <img src={selectedThumb} alt="" />
              ) : (
                <span>
                  <Icon name={selected.status === 'locked' ? 'lock' : 'footprint'} size={27} />
                </span>
              )}
            </div>
            <div className="place-copy">
              <div>
                <span className={`status ${selectedDone ? 'complete' : selected.status}`}>
                  {selectedDone ? '학습 완료' : selected.status === 'available' ? '지금 학습 가능' : '미해금'}
                </span>
                <small>{selected.region}</small>
              </div>
              <strong>{selected.name}</strong>
              <p>{selected.summary}</p>
              <PlaceItems placeId={selected.id} owned={selectedDone} />
            </div>
            {selected.status !== 'locked' && (
              <span className="card-arrow">
                <Icon name="chevron" size={20} />
              </span>
            )}
          </button>
        )}
        {selected && (
          <button
            type="button"
            className={`favorite-heart floating ${favorites.includes(selected.id) ? 'active' : ''}`}
            onClick={() => onToggleFavorite(selected.id)}
            aria-label={favorites.includes(selected.id) ? '관심 장소에서 빼기' : '관심 장소로 추가'}
          >
            <Icon name="heart" size={18} />
          </button>
        )}
      </div>
    </section>
  )
}
