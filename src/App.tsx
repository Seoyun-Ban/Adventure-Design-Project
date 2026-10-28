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
import { NEARBY_RADIUS_M, findPlace, isPlaceOpen, places } from './data/places'
import { NearbyBanner } from './components/NearbyBanner'
import { distanceMeters } from './lib/geo'
import { UNLOCK_ACCURACY_M } from './lib/location'
import { regionAt } from './lib/regions'
import { useProgress } from './hooks/useProgress'
import { useLocation } from './hooks/useLocation'
import { levelFor } from './data/avatar'
import { clearChallengeHash, readChallenge } from './lib/challenge'
import { scrollAppToTop } from './lib/frameScale'
import { generateQuiz, type GeneratedQuiz } from './lib/quizGenerator'
import type { Difficulty, Place, Screen, SocialProvider } from './types'

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
  } = store
  /** 친구가 보낸 도전장 링크로 들어왔으면 그 도전장 (망가진 링크면 ok: false) */
  const [challenge, setChallenge] = useState(() => readChallenge(window.location.hash))
  const [screen, setScreen] = useState<Screen>(challenge ? 'challenge' : 'login')
  const [selectedPlace, setSelectedPlace] = useState<Place>(places[0])
  const [learnDifficulty, setLearnDifficulty] = useState<Difficulty>(progress.defaultDifficulty)
  const [quiz, setQuiz] = useState<QuizSession | null>(null)
  const [quizRun, setQuizRun] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
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
  const pretendPlace = pretendId ? findPlace(pretendId) : undefined
  /** 지금 내가 있는 곳 (위치를 받고 있을 때). 위치는 이 메모리 안에만 있고 저장하지 않는다 */
  const here = useMemo(
    () =>
      pretendPlace?.lat !== undefined && pretendPlace.lng !== undefined
        ? { lat: pretendPlace.lat, lng: pretendPlace.lng, accuracy: 0 }
        : myLocation.position,
    [pretendPlace, myLocation.position],
  )
  /** 방금 반경 안에 들어와 열린 장소 (근처 알림) */
  const [nearby, setNearby] = useState<Place | null>(null)

  // 장소 반경(기본 500m) 안에 들어오면 그 장소를 연다. 위치 오차가 크면 판단하지 않는다.
  // 방문한 장소 id만 저장하고, 설정의 알림이 켜져 있으면 '근처에 ○○이 있어요' 알림을 띄운다.
  useEffect(() => {
    if (!here || here.accuracy > UNLOCK_ACCURACY_M) return
    for (const place of places) {
      if (place.kind !== 'site' || place.lat === undefined || place.lng === undefined) continue
      if (progress.visitedIds.includes(place.id)) continue
      if (distanceMeters(here, { lat: place.lat, lng: place.lng }) > (place.radius ?? NEARBY_RADIUS_M))
        continue
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
        level: levelFor(completedIds.length),
      }
    : null

  function openLearn(place: Place) {
    if (!isPlaceOpen(place, progress.visitedIds)) return
    setSelectedPlace(place)
    setScreen('learn')
    scrollAppToTop()
  }

  function startQuiz(session: QuizSession) {
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
    if (quiz) {
      if (passed) completeQuiz(quiz.place.id, regionFor(quiz.place))
      else completeLearning(quiz.place.id, regionFor(quiz.place))
    }
    setScreen('home')
  }

  function enter(loggedIn: boolean, email?: string) {
    // '먼저 둘러보기'로 쌓은 기록은 로그인하면 그대로 계정 기록이 된다
    if (loggedIn && !progress.loggedIn && progress.onboarded && progress.records.length > 0) {
      showToast(`둘러보며 남긴 발자국 ${progress.records.length}개를 계정에 저장했어요.`)
    }
    update({ loggedIn, rememberedEmail: email })
    setScreen(progress.onboarded ? 'home' : 'onboarding')
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
              if (progress.joined) enter(true)
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
            onDone={(nickname) => {
              // 새로 가입한 계정은 닉네임을 채워 둔 온보딩부터 시작한다
              // (비밀번호·태어난 해와 달·보호자 이메일은 넘겨받지 않으므로 저장되지 않는다)
              update({ loggedIn: true, joined: true, nickname })
              setScreen('onboarding')
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
            store={store}
            location={{ ...myLocation, position: here, status: pretendPlace ? 'on' : myLocation.status }}
            pretendId={pretendId}
            onPretend={setPretendId}
            onLocationOn={() => {
              update({ locationChoice: 'on' })
              myLocation.start()
            }}
            onLocationLater={() => update({ locationChoice: 'later' })}
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
              completeLearning(selectedPlace.id, regionFor(selectedPlace))
              setShowComplete(true)
            }}
            onQuiz={(difficulty) => startPlaceQuiz(selectedPlace, difficulty, 'learn')}
          />
        )}
        {screen === 'quiz' && quiz && (
          <QuizScreen
            key={quizRun}
            title={quiz.title}
            load={quiz.load}
            onBack={() => setScreen(quiz.from === 'learn' && findPlace(quiz.place.id) ? 'learn' : 'home')}
            onDone={finishQuiz}
          />
        )}
      </div>
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
