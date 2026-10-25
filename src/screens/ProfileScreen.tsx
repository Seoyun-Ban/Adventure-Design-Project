import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Avatar } from '../components/Avatar'
import { SubpageHeader } from '../components/SubpageHeader'
import { badges, type BadgeStats } from '../data/badges'
import { findPlace } from '../data/places'
import type { AvatarLook, Equipped, Place } from '../types'

// 내 정보 탭: 요약 통계, 이번 주 탐험, 획득한 배지, 관심 장소
export function ProfileScreen({
  nickname,
  look,
  equipped,
  loggedIn,
  stats,
  weeklyCount,
  favorites,
  completedIds,
  onToggleFavorite,
  onOpenPlace,
}: {
  nickname: string
  look: AvatarLook
  equipped: Equipped
  loggedIn: boolean
  stats: BadgeStats
  /** 최근 7일 동안 학습한 장소 수 */
  weeklyCount: number
  favorites: string[]
  completedIds: string[]
  onToggleFavorite: (placeId: string) => void
  onOpenPlace: (place: Place) => void
}) {
  const [view, setView] = useState<'main' | 'badges' | 'favorites'>('main')
  const earned = badges.filter((badge) => badge.earned(stats))
  const weeklyGoal = 3

  if (view === 'badges') {
    return (
      <section className="utility-screen profile-sub">
        <SubpageHeader
          title="획득한 배지"
          subtitle={`${earned.length} / ${badges.length}개 획득`}
          onBack={() => setView('main')}
        />
        <div className="badge-grid">
          {badges.map((badge) => {
            const has = badge.earned(stats)
            return (
              <div key={badge.id} className={`badge-card ${has ? 'earned' : 'locked'}`}>
                <span className="badge-icon">{has ? badge.icon : <Icon name="lock" size={20} />}</span>
                <strong>{badge.name}</strong>
                <small>{badge.how}</small>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (view === 'favorites') {
    const list = favorites.map(findPlace).filter((place): place is Place => Boolean(place))
    return (
      <section className="utility-screen profile-sub">
        <SubpageHeader title="관심 장소" subtitle="가 보고 싶은 역사 장소" onBack={() => setView('main')} />
        {list.length === 0 ? (
          <div className="book-empty">
            <Icon name="heart" size={30} />
            <strong>아직 관심 장소가 없어요</strong>
            <span>지도에서 장소를 누르고 하트를 눌러 추가해 보세요.</span>
          </div>
        ) : (
          <div className="archive-records quiz-hub-list">
            {list.map((place) => (
              <div className="favorite-row" key={place.id}>
                <button type="button" onClick={() => onOpenPlace(place)} disabled={place.status === 'locked'}>
                  <span className="record-foot">
                    <Icon
                      name={
                        place.status === 'locked'
                          ? 'lock'
                          : completedIds.includes(place.id)
                            ? 'footprint'
                            : 'map'
                      }
                      size={20}
                    />
                  </span>
                  <span className="record-copy">
                    <small>{place.region}</small>
                    <strong>{place.name}</strong>
                    <span className="favorite-state">
                      {place.status === 'locked'
                        ? '방문하면 해금돼요'
                        : completedIds.includes(place.id)
                          ? '학습 완료'
                          : '학습 가능'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="favorite-heart active"
                  onClick={() => onToggleFavorite(place.id)}
                  aria-label={`${place.name} 관심 장소에서 빼기`}
                >
                  <Icon name="heart" size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="content-screen tab-screen">
      <header className="profile-head">
        <div className="profile-avatar">
          <Avatar look={look} equipped={equipped} />
        </div>
        <div>
          <p>{loggedIn ? '반가워요!' : '둘러보는 중이에요'}</p>
          <h2>{nickname}</h2>
          <span>역사 탐험가 · Lv. {1 + stats.footprints}</span>
        </div>
      </header>
      <div className="profile-stats">
        <div>
          <Icon name="footprint" />
          <strong>{stats.footprints}</strong>
          <span>남긴 발자국</span>
        </div>
        <div>
          <Icon name="book" />
          <strong>{stats.booksDone}</strong>
          <span>완료한 이야기책</span>
        </div>
        <div>
          <Icon name="quiz" />
          <strong>{stats.quizzes}</strong>
          <span>완료한 퀴즈</span>
        </div>
      </div>
      <h3 className="section-title">이번 주 탐험</h3>
      <div className="weekly-card">
        <div>
          <strong>{weeklyCount >= weeklyGoal ? '이번 주 목표 달성!' : '한 걸음만 더!'}</strong>
          <span>
            {weeklyCount >= weeklyGoal
              ? '멋진 한 주였어요.'
              : `목표까지 ${weeklyGoal - weeklyCount}곳 남았어요.`}
          </span>
        </div>
        <span>
          {Math.min(weeklyCount, weeklyGoal)} / {weeklyGoal}
        </span>
        <div className="week-track">
          <i style={{ width: `${(Math.min(weeklyCount, weeklyGoal) / weeklyGoal) * 100}%` }} />
        </div>
      </div>
      <div className="profile-menu">
        <button type="button" onClick={() => setView('badges')}>
          <span className="profile-menu-icon">
            <Icon name="sparkle" size={20} />
          </span>
          <strong>획득한 배지</strong>
          <small className="menu-count">
            {earned.length}/{badges.length}
          </small>
          <Icon name="chevron" size={18} />
        </button>
        <button type="button" onClick={() => setView('favorites')}>
          <span className="profile-menu-icon">
            <Icon name="heart" size={20} />
          </span>
          <strong>관심 장소</strong>
          <small className="menu-count">{favorites.length}곳</small>
          <Icon name="chevron" size={18} />
        </button>
      </div>
    </section>
  )
}
