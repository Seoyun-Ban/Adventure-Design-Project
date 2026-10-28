import { useState } from 'react'
import { Icon } from '../components/Icon'
import { KoreaMap } from '../components/KoreaMap'
import { PlaceItems } from '../components/PlaceItems'
import { LocationNotice } from '../components/LocationNotice'
import { placeContents } from '../data/contents'
import type { LocationStatus, MyPosition } from '../hooks/useLocation'
import type { LearningRecord, Place } from '../types'

export function MapScreen({
  records,
  favorites,
  onToggleFavorite,
  onLearn,
  onQuiz,
  onNotice,
  locationStatus,
  myPosition,
  onLocationStart,
}: {
  records: LearningRecord[]
  favorites: string[]
  onToggleFavorite: (placeId: string) => void
  onLearn: (place: Place) => void
  /** '퀴즈' 버튼: 학습한 장소의 퀴즈 고르기 화면 열기 */
  onQuiz: () => void
  /** 아래쪽 알림(토스트) 띄우기 */
  onNotice: (message: string) => void
  /** 실제 내 위치 상태와 위치 (위치는 저장하지 않는다) */
  locationStatus: LocationStatus
  myPosition: MyPosition | null
  /** 위치 켜기 / 다시 시도 */
  onLocationStart: () => void
}) {
  const [selected, setSelected] = useState<Place | null>(null)
  const [showFootprints, setShowFootprints] = useState(true)
  const [showAreas, setShowAreas] = useState(true)
  const selectedDone = selected ? records.some((record) => record.placeId === selected.id) : false
  const selectedThumb = selected ? placeContents[selected.id]?.heroImage : ''

  return (
    <section className="map-screen tab-screen">
      <div className="map-paper" />
      <header className="map-header">
        <div className="map-heading">
          <span>오늘의 역사 산책</span>
          <strong>어디로 떠나볼까요?</strong>
        </div>
      </header>

      <LocationNotice status={locationStatus} position={myPosition} onStart={onLocationStart} />

      <div className="map-viewport">
        <KoreaMap
          records={records}
          showFootprints={showFootprints}
          showAreas={showAreas}
          me={myPosition}
          onSelect={setSelected}
          onNotice={onNotice}
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
          {/* 켜고 끄는 버튼이 아니라, 학습한 장소의 퀴즈를 고르는 화면으로 간다 */}
          <button type="button" className="legend-quiz" onClick={onQuiz}>
            <Icon name="quiz" size={14} />
            퀴즈
          </button>
        </div>
      </div>

      <div className={`place-sheet ${selected ? 'show' : ''}`}>
        {selected && (
          <button
            className="place-card"
            type="button"
            onClick={() =>
              selected.status === 'locked'
                ? onNotice(`${selected.name}에 직접 찾아가면 이야기가 열려요`)
                : onLearn(selected)
            }
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
