import { useState } from 'react'
import { Icon } from '../components/Icon'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { SubpageHeader } from '../components/SubpageHeader'
import { levelFor, xpToNextLevel } from '../data/avatar'
import { badges, type BadgeStats } from '../data/badges'
import { findPlace, isPlaceOpen } from '../data/places'
import type { AvatarLook, Place } from '../types'

// 내 정보 탭: 요약 통계, 획득한 배지, 관심 장소, 학습 아카이브, 도움말
// 오른쪽 위 톱니바퀴로 설정(개인정보 고치기 포함)을 연다.
export function ProfileScreen({
  nickname,
  look,
  loggedIn,
  stats,
  xp,
  favorites,
  completedIds,
  visitedIds,
  onToggleFavorite,
  onOpenPlace,
  onEditNickname,
  onOpenSettings,
  onOpenArchive,
  onOpenHelp,
}: {
  nickname: string
  look: AvatarLook
  loggedIn: boolean
  stats: BadgeStats
  /** 퀴즈로 모은 경험치 (레벨 계산) */
  xp: number
  favorites: string[]
  completedIds: string[]
  /** 방문해서 열린 장소 id */
  visitedIds: string[]
  onToggleFavorite: (placeId: string) => void
  onOpenPlace: (place: Place) => void
  onEditNickname: () => void
  onOpenSettings: () => void
  onOpenArchive: () => void
  onOpenHelp: () => void
}) {
  const [view, setView] = useState<'main' | 'badges' | 'favorites'>('main')
  const earned = badges.filter((badge) => badge.earned(stats))

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
                <span className="badge-icon">
                  {!has ? (
                    <Icon name="lock" size={20} />
                  ) : badge.icon === 'footprint' ? (
                    <Icon name="footprint" size={30} />
                  ) : (
                    badge.icon
                  )}
                </span>
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
                <button
                  type="button"
                  onClick={() => onOpenPlace(place)}
                  disabled={!isPlaceOpen(place, visitedIds)}
                >
                  <span className="record-foot">
                    <Icon
                      name={
                        !isPlaceOpen(place, visitedIds)
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
                      {!isPlaceOpen(place, visitedIds)
                        ? '직접 가면 열려요'
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
    <section className="content-screen tab-screen profile-screen">
      <button
        type="button"
        className="icon-button profile-settings"
        onClick={onOpenSettings}
        aria-label="설정"
      >
        <Icon name="settings" size={21} />
      </button>
      <header className="profile-head">
        <div className="profile-avatar">
          <CharacterAvatar look={look} label={`${nickname}의 아바타`} />
        </div>
        <div>
          <p>{loggedIn ? '반가워요!' : '둘러보는 중이에요'}</p>
          <div className="profile-name">
            <h2>{nickname}</h2>
            <button
              className="nickname-edit"
              type="button"
              onClick={onEditNickname}
              aria-label="닉네임 바꾸기"
            >
              <Icon name="edit" size={16} />
            </button>
          </div>
          <span>
            역사 탐험가 · Lv. {levelFor(xp)} · 다음 레벨까지 {xpToNextLevel(xp)} XP
          </span>
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
          <strong>{stats.chaptersRead}</strong>
          <span>읽은 이야기</span>
        </div>
        <div>
          <Icon name="quiz" />
          <strong>{stats.quizzes}</strong>
          <span>완료한 퀴즈</span>
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
        <button type="button" onClick={onOpenArchive}>
          <span className="profile-menu-icon">
            <Icon name="archive" size={20} />
          </span>
          <strong>학습 아카이브</strong>
          <small className="menu-count">{stats.footprints}개 기록</small>
          <Icon name="chevron" size={18} />
        </button>
        <button type="button" onClick={onOpenHelp}>
          <span className="profile-menu-icon">
            <Icon name="help" size={20} />
          </span>
          <strong>도움말</strong>
          <small className="menu-count">사용법·문의</small>
          <Icon name="chevron" size={18} />
        </button>
      </div>
    </section>
  )
}
