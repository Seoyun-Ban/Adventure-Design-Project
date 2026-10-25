import { useState } from 'react'
import { BottomTabs } from '../components/BottomTabs'
import { SideMenu } from '../components/SideMenu'
import { MapScreen } from './MapScreen'
import { StoryBookScreen } from './StoryBookScreen'
import { AvatarScreen } from './AvatarScreen'
import { ProfileScreen } from './ProfileScreen'
import { ArchiveScreen } from './ArchiveScreen'
import { SettingsScreen } from './SettingsScreen'
import { QuizHubScreen } from './QuizHubScreen'
import { isBookDone, storyBooks } from '../data/storyBooks'
import { places } from '../data/places'
import type { useProgress } from '../hooks/useProgress'
import type { Place, SubPage, Tab } from '../types'

// 로그인 이후의 메인 화면: 하단 탭 4개 + 왼쪽 메뉴에서 여는 서브 화면
export function HomeScreen({
  store,
  onLearn,
  onStartQuiz,
  onStartReview,
  onLogin,
  onLogout,
  onEditAvatar,
}: {
  store: ReturnType<typeof useProgress>
  onLearn: (place: Place) => void
  onStartQuiz: (place: Place) => void
  onStartReview: () => void
  onLogin: () => void
  onLogout: () => void
  onEditAvatar: () => void
}) {
  const { progress, completedIds, quizDoneIds, update, equip, resetProgress, toggleFavorite, recordBattle } =
    store
  const [tab, setTab] = useState<Tab>('map')
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState<SubPage>('main')
  const back = () => setPage('main')
  const avatar = {
    nickname: progress.nickname,
    look: progress.look,
    equipped: progress.equipped,
    faceImage: progress.faceImage,
  }

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
          onEditAvatar={onEditAvatar}
          onBack={back}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      </main>
    )
  }
  if (page === 'quiz-new' || page === 'quiz-review') {
    return (
      <main className="screen home-shell">
        <QuizHubScreen
          mode={page === 'quiz-new' ? 'new' : 'review'}
          completedIds={completedIds}
          quizDoneIds={quizDoneIds}
          wrongAnswers={progress.wrongAnswers}
          onBack={back}
          onStart={onStartQuiz}
          onStartReview={onStartReview}
        />
      </main>
    )
  }

  return (
    <main className="screen home-shell">
      {tab === 'map' && (
        <MapScreen
          records={progress.records}
          pushEnabled={progress.pushEnabled}
          favorites={progress.favorites}
          onToggleFavorite={toggleFavorite}
          onLearn={onLearn}
          onMenu={() => setMenuOpen(true)}
        />
      )}
      {tab === 'book' && <StoryBookScreen completedIds={completedIds} onLearn={onLearn} />}
      {tab === 'avatar' && (
        <AvatarScreen {...avatar} completedIds={completedIds} onEquip={equip} onBattleEnd={recordBattle} />
      )}
      {tab === 'profile' && (
        <ProfileScreen
          {...avatar}
          loggedIn={progress.loggedIn}
          stats={{
            footprints: completedIds.length,
            quizzes: quizDoneIds.length,
            booksDone: storyBooks.filter((book) => isBookDone(book, completedIds)).length,
            wins: progress.battle.wins,
            battles: progress.battle.played,
            equippedCount: Object.values(progress.equipped).filter(Boolean).length,
            totalPlaces: places.filter((place) => place.status === 'available').length,
          }}
          weeklyCount={
            progress.records.filter(
              (record) => Date.now() - new Date(record.learnedAt).getTime() < 7 * 86400000,
            ).length
          }
          favorites={progress.favorites}
          completedIds={completedIds}
          onToggleFavorite={toggleFavorite}
          onOpenPlace={onLearn}
        />
      )}
      <BottomTabs active={tab} onChange={setTab} />
      <SideMenu
        open={menuOpen}
        {...avatar}
        footprintCount={completedIds.length}
        onClose={() => setMenuOpen(false)}
        onNavigate={setPage}
      />
    </main>
  )
}
