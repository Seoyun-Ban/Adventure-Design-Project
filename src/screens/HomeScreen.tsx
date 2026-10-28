import { useState } from 'react'
import { BottomTabs } from '../components/BottomTabs'
import { NicknameSheet } from '../components/NicknameSheet'
import { LocationIntro } from '../components/LocationIntro'
import { LocationPicker } from '../components/LocationPicker'
import { MapScreen } from './MapScreen'
import { StoryBookScreen } from './StoryBookScreen'
import { AvatarScreen } from './AvatarScreen'
import { ProfileScreen } from './ProfileScreen'
import { ProfileEditScreen } from './ProfileEditScreen'
import { ArchiveScreen } from './ArchiveScreen'
import { SettingsScreen } from './SettingsScreen'
import { HelpScreen } from './HelpScreen'
import { QuizHubScreen } from './QuizHubScreen'
import { isBookCaughtUp, storyBooks, totalReadCount } from '../data/storyBooks'
import { places } from '../data/places'
import type { useProgress } from '../hooks/useProgress'
import type { useLocation } from '../hooks/useLocation'
import type { Place, SubPage, Tab } from '../types'

// 로그인 이후의 메인 화면: 하단 탭 4개 + 잠깐 여는 서브 화면
// - 지도의 '퀴즈' → 퀴즈 고르기
// - 내 정보의 학습 아카이브·도움말, 오른쪽 위 톱니바퀴 → 설정 → 개인정보 고치기
export function HomeScreen({
  store,
  location,
  pretendId,
  onPretend,
  onLocationOn,
  onLocationLater,
  onLearn,
  onStartQuiz,
  onLogin,
  onLogout,
  onNotice,
}: {
  store: ReturnType<typeof useProgress>
  /** 실제 내 위치 (App에서 하나만 켠다) */
  location: ReturnType<typeof useLocation>
  /** 숨겨진 위치 고르기로 고른 장소 (없으면 실제 위치) */
  pretendId: string | null
  onPretend: (placeId: string | null) => void
  /** 위치 설명 화면에서 '위치 켜기' / '나중에' */
  onLocationOn: () => void
  onLocationLater: () => void
  onLearn: (place: Place) => void
  onStartQuiz: (place: Place) => void
  onLogin: () => void
  onLogout: () => void
  /** 화면 아래 안내 메시지 (토스트) */
  onNotice: (message: string) => void
}) {
  const {
    progress,
    completedIds,
    quizDoneIds,
    update,
    equip,
    resetProgress,
    toggleFavorite,
    recordBattle,
    addInquiry,
  } = store
  const [tab, setTab] = useState<Tab>('map')
  const [page, setPage] = useState<SubPage>('main')
  const back = () => setPage('main')
  // 등록한 얼굴 사진은 학습 영상 장면에서만 쓰고, 홈 화면들의 아바타는 기본 얼굴로 보여준다.
  const avatar = {
    nickname: progress.nickname,
    look: progress.look,
    equipped: progress.equipped,
  }
  // 닉네임 바꾸기 창: 내 정보 탭의 연필 버튼
  const [nicknameOpen, setNicknameOpen] = useState(false)
  // 지도 제목을 5번 빠르게 누르면 여는 위치 고르기 창
  const [pickerOpen, setPickerOpen] = useState(false)

  if (page === 'archive') {
    return (
      <main className="screen home-shell">
        <ArchiveScreen records={progress.records} onBack={back} />
      </main>
    )
  }
  if (page === 'settings') {
    return (
      <main className="screen home-shell">
        <SettingsScreen
          loggedIn={progress.loggedIn}
          nickname={progress.nickname}
          email={progress.rememberedEmail}
          difficulty={progress.defaultDifficulty}
          pushEnabled={progress.pushEnabled}
          onDifficultyChange={(defaultDifficulty) => update({ defaultDifficulty })}
          onPushChange={(pushEnabled) => update({ pushEnabled })}
          onReset={resetProgress}
          onEditProfile={() => setPage('profile-edit')}
          onBack={back}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      </main>
    )
  }
  if (page === 'profile-edit') {
    return (
      <main className="screen home-shell">
        <ProfileEditScreen
          nickname={progress.nickname}
          look={progress.look}
          faceImage={progress.faceImage}
          onSave={(patch) => {
            update(patch)
            setPage('settings')
            onNotice('개인정보를 저장했어요')
          }}
          onBack={() => setPage('settings')}
        />
      </main>
    )
  }
  if (page === 'help') {
    return (
      <main className="screen home-shell">
        <HelpScreen inquiries={progress.inquiries} onSendInquiry={addInquiry} onBack={back} />
      </main>
    )
  }
  if (page === 'quiz') {
    return (
      <main className="screen home-shell">
        <QuizHubScreen
          completedIds={completedIds}
          quizDoneIds={quizDoneIds}
          onBack={back}
          onStart={onStartQuiz}
        />
      </main>
    )
  }

  return (
    <main className="screen home-shell">
      {tab === 'map' && (
        <MapScreen
          records={progress.records}
          visitedIds={progress.visitedIds}
          favorites={progress.favorites}
          onToggleFavorite={toggleFavorite}
          onLearn={onLearn}
          onQuiz={() => setPage('quiz')}
          onNotice={onNotice}
          locationStatus={location.status}
          myPosition={location.position}
          onLocationStart={onLocationOn}
          onTitleSecret={() => setPickerOpen(true)}
        />
      )}
      {/* 처음 지도에 들어오면 위치를 쓰는 이유를 먼저 설명하고, 그다음에 브라우저가 허용 여부를 묻는다 */}
      {tab === 'map' && !progress.locationChoice && (
        <LocationIntro onAllow={onLocationOn} onLater={onLocationLater} />
      )}
      {tab === 'book' && (
        <StoryBookScreen completedIds={completedIds} visitedIds={progress.visitedIds} onLearn={onLearn} />
      )}
      {tab === 'avatar' && (
        <AvatarScreen
          {...avatar}
          completedIds={completedIds}
          battle={progress.battle}
          onEquip={equip}
          onBattleEnd={recordBattle}
          onNotice={onNotice}
        />
      )}
      {tab === 'profile' && (
        <ProfileScreen
          {...avatar}
          loggedIn={progress.loggedIn}
          stats={{
            footprints: completedIds.length,
            quizzes: quizDoneIds.length,
            chaptersRead: totalReadCount(completedIds),
            booksCaughtUp: storyBooks.filter((book) =>
              isBookCaughtUp(book, completedIds, progress.visitedIds),
            ).length,
            wins: progress.battle.wins,
            battles: progress.battle.played,
            equippedCount: Object.values(progress.equipped).filter(Boolean).length,
            totalPlaces: places.length,
          }}
          favorites={progress.favorites}
          completedIds={completedIds}
          visitedIds={progress.visitedIds}
          onToggleFavorite={toggleFavorite}
          onOpenPlace={onLearn}
          onEditNickname={() => setNicknameOpen(true)}
          onOpenSettings={() => setPage('settings')}
          onOpenArchive={() => setPage('archive')}
          onOpenHelp={() => setPage('help')}
        />
      )}
      <BottomTabs active={tab} onChange={setTab} />
      {pickerOpen && (
        <LocationPicker
          currentId={pretendId ?? undefined}
          onPick={(placeId) => {
            onPretend(placeId)
            setPickerOpen(false)
          }}
          onUseReal={() => {
            onPretend(null)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {nicknameOpen && (
        <NicknameSheet
          current={progress.nickname}
          onClose={() => setNicknameOpen(false)}
          onSave={(nickname) => {
            update({ nickname })
            setNicknameOpen(false)
            onNotice('닉네임을 바꿨어요')
          }}
        />
      )}
    </main>
  )
}
