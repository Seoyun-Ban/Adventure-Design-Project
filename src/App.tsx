import { useEffect, useMemo, useState } from 'react'
import { LoginScreen } from './screens/LoginScreen'
import { ChallengeScreen } from './screens/ChallengeScreen'
import { SignupScreen } from './screens/SignupScreen'
import { ResetPasswordScreen } from './screens/ResetPasswordScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LearnScreen } from './screens/LearnScreen'
import { QuizScreen } from './screens/QuizScreen'
import { CompleteModal } from './components/CompleteModal'
import { ItemRewardModal } from './components/ItemRewardModal'
import { findPlace, isInsideUnlockArea, isPlaceOpen, places, pretendSpot } from './data/places'
import { NearbyBanner } from './components/NearbyBanner'
import { UNLOCK_ACCURACY_M } from './lib/location'
import { regionAt } from './lib/regions'
import { useProgress } from './hooks/useProgress'
import { useLocation } from './hooks/useLocation'
import { itemsForPlace, levelFor } from './data/avatar'
import { clearChallengeHash, readChallenge } from './lib/challenge'
import { scrollAppToTop } from './lib/frameScale'
import { generateQuiz, type GeneratedQuiz } from './lib/quizGenerator'
import type { Difficulty, HistoryItem, Place, Screen, SocialProvider, Tab } from './types'

/** 장소 퀴즈 한 번 (통과하면 그 장소의 퀴즈 완료) */
type QuizSession = {
  title: string
  load: () => Promise<GeneratedQuiz[]>
  place: Place
  /** 퀴즈를 연 곳: 학습 화면 또는 지도의 '퀴즈' */
  from: 'learn' | 'home'
}

// 앱 최상위: 어떤 화면을 보여줄지(로그인/온보딩/홈/학습/퀴즈)와 사용자 진행 상황을 관리한다
export default function App() {
  const store = useProgress()
  const {
    progress,
    completedIds,
    update,
    completeLearning,
    completeQuiz,
    toggleFavorite,
    recordBattle,
    visitPlace,
    clearAll,
    resetProgress,
    addXp,
    equip,
  } = store
  /** 친구가 보낸 도전장 링크로 들어왔으면 그 도전장 (망가진 링크면 ok: false) */
  const [challenge, setChallenge] = useState(() => readChallenge(window.location.hash))
  const [screen, setScreen] = useState<Screen>(challenge ? 'challenge' : 'login')
  const [selectedPlace, setSelectedPlace] = useState<Place>(places[0])
  const [learnDifficulty, setLearnDifficulty] = useState<Difficulty>(progress.defaultDifficulty)
  const [quiz, setQuiz] = useState<QuizSession | null>(null)
  const [quizRun, setQuizRun] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  /**
   * 처음 학습을 마쳐 얻은 아이템 카드 (한 장씩 차례로)
   * then: 카드를 다 본 뒤 발자국 획득 창(complete)으로 갈지, 그냥 홈(home)에 있을지
   */
  const [reward, setReward] = useState<{
    items: HistoryItem[]
    index: number
    then: 'complete' | 'home'
  } | null>(null)
  /** 홈 화면을 열 때 보여줄 탭 ('바로 입어보기'는 아바타 탭으로) */
  const [homeTab, setHomeTab] = useState<Tab>('map')
  const [homeKey, setHomeKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  /** 간편 로그인으로 처음 가입할 때 그 회사 (없으면 이메일 가입) */
  const [signupProvider, setSignupProvider] = useState<SocialProvider>()
  /** 실제 내 위치 (앱 전체에서 하나만 켠다. 위치는 저장하지 않는다) */
  const myLocation = useLocation()
  const startLocation = myLocation.start

  // 전에 '위치 켜기'를 골랐으면 앱을 열 때 바로 위치를 받기 시작한다
  useEffect(() => {
    if (progress.locationChoice === 'on') startLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 지도 제목을 5번 눌러 고른 장소 (그 장소에 서 있는 것처럼 동작). 저장하지 않아 새로고침하면 사라진다.
   * 고르지 않았으면 null → 실제 내 위치를 쓴다.
   */
  const [pretendId, setPretendId] = useState<string | null>(null)
  const pretendSpotNow = pretendId ? pretendSpot(pretendId) : undefined
  /** 지금 내가 있는 곳 (위치를 받고 있을 때). 위치는 이 메모리 안에만 있고 저장하지 않는다 */
  const here = useMemo(
    () =>
      pretendSpotNow ? { ...pretendSpotNow, accuracy: 0 } : myLocation.position,
    [pretendSpotNow, myLocation.position],
  )
  /** 방금 반경 안에 들어와 열린 장소 (근처 알림) */
  const [nearby, setNearby] = useState<Place | null>(null)

  // 장소 반경(기본 500m) 안에 들어오면 그 장소를 연다. 위치 오차가 크면 판단하지 않는다.
  // 방문한 장소 id만 저장하고, 설정의 알림이 켜져 있으면 '근처에 ○○이 있어요' 알림을 띄운다.
  useEffect(() => {
    if (!here || here.accuracy > UNLOCK_ACCURACY_M) return
    for (const place of places) {
      if (place.kind !== 'site' || progress.visitedIds.includes(place.id)) continue
      if (!isInsideUnlockArea(place, here)) continue
      visitPlace(place.id)
      if (progress.pushEnabled) setNearby(place)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [here, progress.visitedIds, progress.pushEnabled])

  /** 위치가 없는 사건(event)은 학습할 때 내가 있던 시·도에 발자국을 남긴다 (위치를 모르면 기본 시·도) */
  const regionFor = (place: Place) => (place.kind === 'event' && here ? regionAt(here) : undefined)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  // 앱을 켜 둔 채로 도전장 링크를 열어도(주소의 # 부분만 바뀜) 도전장 화면으로 간다
  useEffect(() => {
    const onHash = () => {
      const next = readChallenge(window.location.hash)
      if (!next) return
      setChallenge(next)
      setScreen('challenge')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /** 도전장 화면을 떠나면 주소에서 도전장을 지운다 (새로고침해도 다시 열리지 않게) */
  function leaveChallenge(next: Screen) {
    clearChallengeHash()
    setChallenge(null)
    setScreen(next)
  }

  /** 내 아바타를 도전장 모양으로 (온보딩을 마친 사람만) */
  const meAsChallenger = progress.onboarded
    ? {
        nickname: progress.nickname,
        look: progress.look,
        equipped: progress.equipped,
        level: levelFor(progress.xp),
      }
    : null

  /** 이 장소를 처음 학습하면 얻는 아이템 (이미 학습한 장소면 없음) */
  const newItemsFor = (place: Place) => (completedIds.includes(place.id) ? [] : itemsForPlace(place.id))

  /** 아이템 카드 다음 장으로. 마지막 장이면 닫고 정해 둔 곳으로 */
  function nextReward(wore: boolean) {
    if (!reward) return
    if (reward.index + 1 < reward.items.length) {
      setReward({ ...reward, index: reward.index + 1 })
      return
    }
    setReward(null)
    if (wore) {
      // 입어 본 모습을 바로 볼 수 있게 아바타 탭으로
      setHomeTab('avatar')
      setHomeKey((key) => key + 1)
      setScreen('home')
    } else if (reward.then === 'complete') {
      setShowComplete(true)
    }
  }

  function openLearn(place: Place) {
    if (!isPlaceOpen(place, progress.visitedIds)) return
    setHomeTab('map')
    setSelectedPlace(place)
    setScreen('learn')
    scrollAppToTop()
  }

  function startQuiz(session: QuizSession) {
    setHomeTab('map')
    setQuiz(session)
    setQuizRun((value) => value + 1)
    setScreen('quiz')
    scrollAppToTop()
  }

  /** 장소 퀴즈: 학습 단계와 같은 난이도로 매번 새로 출제 */
  function startPlaceQuiz(place: Place, difficulty: Difficulty, from: 'learn' | 'home') {
    setSelectedPlace(place)
    startQuiz({
      title: `${place.name} 퀴즈 · ${difficulty}`,
      load: () => generateQuiz(place.id, difficulty),
      place,
      from,
    })
  }

  function finishQuiz(passed: boolean) {
    // 퀴즈로 처음 학습을 마친 경우에도 아이템 카드를 보여준다
    const items = quiz ? newItemsFor(quiz.place) : []
    if (items.length > 0) setReward({ items, index: 0, then: 'home' })
    if (quiz) {
      if (passed) completeQuiz(quiz.place.id, regionFor(quiz.place))
      else completeLearning(quiz.place.id, regionFor(quiz.place))
    }
    setScreen('home')
  }

  /**
   * 로그인(이메일 또는 간편 로그인) / 먼저 둘러보기
   * - email: 이메일 로그인한 계정 이메일, remember: '이메일 기억하기'
   * - provider: 간편 로그인 회사
   */
  function enter(loggedIn: boolean, email?: string, remember?: boolean, provider?: SocialProvider) {
    // '먼저 둘러보기'로 쌓은 기록은 로그인하면 그대로 계정 기록이 된다
    if (loggedIn && !progress.loggedIn && progress.onboarded && progress.records.length > 0) {
      showToast(`둘러보며 남긴 발자국 ${progress.records.length}개를 계정에 저장했어요.`)
    }
    update({
      loggedIn,
      rememberedEmail: remember ? email : undefined,
      ...(loggedIn ? { loginProvider: provider, accountEmail: provider ? undefined : email } : {}),
    })
    setScreen(progress.onboarded ? 'home' : 'onboarding')
  }

  /** 회원 탈퇴: 이 기기에 저장된 기록(학습 기록, 아바타, 계정 정보)을 모두 지우고 처음 화면으로 */
  function withdraw() {
    clearAll()
    setPretendId(null)
    setScreen('login')
    showToast('탈퇴했어요. 그동안 함께해 줘서 고마워요.')
  }

  /**
   * 처음부터 다시 시작하기 (설정): 학습 기록·아바타를 처음 실행했을 때 상태로 돌리고 처음 화면(로그인)부터 다시 시작한다
   * (그래야 아바타 설정 → 지도 → 앱 소개 → 위치 설명 순서가 다시 나온다)
   */
  function resetAll() {
    resetProgress()
    setPretendId(null)
    setHomeTab('map')
    setScreen('login')
    showToast('처음 상태로 돌아갔어요. 처음 화면부터 다시 시작해요.')
  }

  return (
    <div className="app-frame">
      {/* 컴퓨터 화면에서는 틀 크기가 고정이라 이 안에서 스크롤된다 */}
      <div className="app-scroll">
        {screen === 'challenge' && challenge && (
          <ChallengeScreen
            challenge={challenge}
            me={meAsChallenger}
            onFinish={recordBattle}
            onStart={() => leaveChallenge('login')}
            onClose={() => leaveChallenge('home')}
            onNotice={showToast}
          />
        )}
        {screen === 'login' && (
          <LoginScreen
            rememberedEmail={progress.rememberedEmail}
            onEnter={enter}
            onSocial={(provider) => {
              // 이 기기에서 처음 쓰는 간편 로그인이면 이메일 가입과 같은 나이 확인·보호자 허락 단계를 거친다
              if (progress.joined) enter(true, undefined, false, provider)
              else {
                setSignupProvider(provider)
                setScreen('signup')
              }
            }}
            onSignup={() => {
              setSignupProvider(undefined)
              setScreen('signup')
            }}
            onFindPassword={(email) => {
              setResetEmail(email)
              setScreen('reset')
            }}
          />
        )}
        {screen === 'signup' && (
          <SignupScreen
            provider={signupProvider}
            onBack={() => setScreen('login')}
            onDone={(nickname, email) => {
              // 새로 가입한 계정은 닉네임을 채워 둔 온보딩부터 시작한다
              // (비밀번호·태어난 해와 달·보호자 이메일은 넘겨받지 않으므로 저장되지 않는다)
              update({
                loggedIn: true,
                joined: true,
                nickname,
                loginProvider: signupProvider,
                accountEmail: email,
              })
              // 아직 아바타를 만들지 않았으면 아바타 설정부터. 먼저 둘러보기로 이미 만들었으면 그대로 지도로
              setScreen(progress.onboarded ? 'home' : 'onboarding')
            }}
          />
        )}
        {screen === 'reset' && (
          <ResetPasswordScreen initialEmail={resetEmail} onBack={() => setScreen('login')} />
        )}
        {screen === 'onboarding' && (
          <OnboardingScreen
            initial={progress}
            equipped={progress.equipped}
            onDone={(result) => {
              update({ ...result, onboarded: true })
              setScreen('home')
            }}
          />
        )}
        {screen === 'home' && (
          <HomeScreen
            key={homeKey}
            initialTab={homeTab}
            store={store}
            location={{ ...myLocation, position: here, status: pretendSpotNow ? 'on' : myLocation.status }}
            pretendId={pretendId}
            onPretend={setPretendId}
            onLocationOn={() => {
              update({ locationChoice: 'on' })
              myLocation.start()
            }}
            onLocationLater={() => update({ locationChoice: 'later' })}
            onWithdraw={withdraw}
            onReset={resetAll}
            onLearn={openLearn}
            onStartQuiz={(place) => startPlaceQuiz(place, progress.defaultDifficulty, 'home')}
            onLogin={() => setScreen('login')}
            onLogout={() => {
              update({ loggedIn: false })
              setScreen('login')
            }}
            onNotice={showToast}
          />
        )}
        {screen === 'learn' && (
          <LearnScreen
            key={selectedPlace.id}
            place={selectedPlace}
            defaultDifficulty={progress.defaultDifficulty}
            avatar={{
              nickname: progress.nickname,
              look: progress.look,
              equipped: progress.equipped,
              faceImage: progress.faceImage,
            }}
            favorite={progress.favorites.includes(selectedPlace.id)}
            completed={completedIds.includes(selectedPlace.id)}
            onToggleFavorite={() => toggleFavorite(selectedPlace.id)}
            onBack={() => setScreen('home')}
            onComplete={(difficulty) => {
              setLearnDifficulty(difficulty)
              const items = newItemsFor(selectedPlace)
              completeLearning(selectedPlace.id, regionFor(selectedPlace))
              // 처음 학습을 마쳤으면 아이템 카드 → 발자국 획득 창, 아니면 바로 발자국 획득 창
              if (items.length > 0) setReward({ items, index: 0, then: 'complete' })
              else setShowComplete(true)
            }}
            onQuiz={(difficulty) => startPlaceQuiz(selectedPlace, difficulty, 'learn')}
          />
        )}
        {screen === 'quiz' && quiz && (
          <QuizScreen
            key={quizRun}
            title={quiz.title}
            load={quiz.load}
            xp={progress.xp}
            onXp={addXp}
            onBack={() => setScreen(quiz.from === 'learn' && findPlace(quiz.place.id) ? 'learn' : 'home')}
            onDone={finishQuiz}
          />
        )}
      </div>
      {reward && (
        <ItemRewardModal
          item={reward.items[reward.index]}
          index={reward.index}
          total={reward.items.length}
          onWear={() => {
            const item = reward.items[reward.index]
            equip(item.category, item.id)
            nextReward(true)
          }}
          onLater={() => nextReward(false)}
        />
      )}
      {showComplete && (
        <CompleteModal
          place={selectedPlace}
          onConfirm={() => {
            setShowComplete(false)
            setScreen('home')
          }}
          onQuiz={() => {
            setShowComplete(false)
            startPlaceQuiz(selectedPlace, learnDifficulty, 'learn')
          }}
        />
      )}
      {toast && (
        <div className="app-toast" role="status">
          {toast}
        </div>
      )}
      {nearby && (
        <NearbyBanner
          key={nearby.id}
          place={nearby}
          onOpen={() => {
            setNearby(null)
            openLearn(nearby)
          }}
          onClose={() => setNearby(null)}
        />
      )}
    </div>
  )
}
