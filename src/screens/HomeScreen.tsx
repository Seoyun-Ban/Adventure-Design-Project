import { useState } from 'react'
import { BottomTabs } from '../components/BottomTabs'
import { SideMenu } from '../components/SideMenu'
import { NicknameSheet } from '../components/NicknameSheet'
import { MapScreen } from './MapScreen'
import { StoryBookScreen } from './StoryBookScreen'
import { AvatarScreen } from './AvatarScreen'
import { ProfileScreen } from './ProfileScreen'
import { ArchiveScreen } from './ArchiveScreen'
import { SettingsScreen } from './SettingsScreen'
import { HelpScreen } from './HelpScreen'
import { QuizHubScreen } from './QuizHubScreen'
import { isBookCaughtUp, storyBooks, totalReadCount } from '../data/storyBooks'
import { weeklyCount } from '../lib/weekly'
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
  onNotice,
}: {
  store: ReturnType<typeof useProgress>
  onLearn: (place: Place) => void
  onStartQuiz: (place: Place) => void
  onStartReview: () => void
  onLogin: () => void
  onLogout: () => void
  onEditAvatar: () => void
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState<SubPage>('main')
  const back = () => setPage('main')
  // 등록한 얼굴 사진은 학습 영상 장면에서만 쓰고, 홈 화면들의 아바타는 기본 얼굴로 보여준다.
  const avatar = {
    nickname: progress.nickname,
    look: progress.look,
    equipped: progress.equipped,
  }
  // 닉네임 바꾸기 창: 내 정보 탭과 설정 화면에서 함께 쓴다
  const [nicknameOpen, setNicknameOpen] = useState(false)
  const openNickname = () => setNicknameOpen(true)
  const nicknameSheet = nicknameOpen && (
    <NicknameSheet
      current={progress.nickname}
      onClose={() => setNicknameOpen(false)}
      onSave={(nickname) => {
        update({ nickname })
        setNicknameOpen(false)
        onNotice('닉네임을 바꿨어요')
      }}
    />
  )

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
          onEditNickname={openNickname}
          onBack={back}
          onLogin={onLogin}
          onLogout={onLogout}
        />
        {nicknameSheet}
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
          onNotice={onNotice}
        />
      )}
      {tab === 'book' && <StoryBookScreen completedIds={completedIds} onLearn={onLearn} />}
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
            booksCaughtUp: storyBooks.filter((book) => isBookCaughtUp(book, completedIds)).length,
            wins: progress.battle.wins,
            battles: progress.battle.played,
            equippedCount: Object.values(progress.equipped).filter(Boolean).length,
            totalPlaces: places.filter((place) => place.status === 'available').length,
          }}
          weeklyCount={weeklyCount(progress.records)}
          favorites={progress.favorites}
          completedIds={completedIds}
          onToggleFavorite={toggleFavorite}
          onOpenPlace={onLearn}
          onEditNickname={openNickname}
          battle={progress.battle}
        />
      )}
      <BottomTabs active={tab} onChange={setTab} />
      <SideMenu
        open={menuOpen}
        {...avatar}
        footprintCount={completedIds.length}
        weeklyCount={weeklyCount(progress.records)}
        onClose={() => setMenuOpen(false)}
        onNavigate={setPage}
      />
      {nicknameSheet}
    </main>
  )
}
