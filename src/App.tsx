import { useState } from 'react'
import { LoginScreen } from './screens/LoginScreen'
import { SignupScreen } from './screens/SignupScreen'
import { ResetPasswordScreen } from './screens/ResetPasswordScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LearnScreen } from './screens/LearnScreen'
import { QuizScreen, type QuizResult } from './screens/QuizScreen'
import { CompleteModal } from './components/CompleteModal'
import { CURRENT_LOCATION, findPlace, places } from './data/places'
import { useProgress } from './hooks/useProgress'
import { generateLocal, generateQuiz, shuffleOptions, type GeneratedQuiz } from './lib/quizGenerator'
import type { Difficulty, Place, Screen } from './types'

/** 복습 퀴즈 문제 수 */
const REVIEW_COUNT = 5

type QuizSession = {
  title: string
  load: () => Promise<GeneratedQuiz[]>
  /** place: 장소 퀴즈 (통과하면 퀴즈 완료), review: 복습 퀴즈 */
  kind: 'place' | 'review'
  place?: Place
  from: 'learn' | 'home'
}

// 앱 최상위: 어떤 화면을 보여줄지(로그인/온보딩/홈/학습/퀴즈)와 사용자 진행 상황을 관리한다
export default function App() {
  const store = useProgress()
  const { progress, completedIds, update, completeLearning, completeQuiz, recordAnswers, toggleFavorite } =
    store
  const [screen, setScreen] = useState<Screen>('login')
  const [selectedPlace, setSelectedPlace] = useState<Place>(places[0])
  const [learnDifficulty, setLearnDifficulty] = useState<Difficulty>(progress.defaultDifficulty)
  const [quiz, setQuiz] = useState<QuizSession | null>(null)
  const [quizRun, setQuizRun] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')

  /** 위치가 없는 사건(event)은 지금 내 위치에 발자국을 남긴다 */
  const positionFor = (place: Place) => (place.kind === 'event' ? CURRENT_LOCATION : undefined)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  function openLearn(place: Place) {
    if (place.status === 'locked') return
    setSelectedPlace(place)
    setScreen('learn')
    window.scrollTo(0, 0)
  }

  function startQuiz(session: QuizSession) {
    setQuiz(session)
    setQuizRun((value) => value + 1)
    setScreen('quiz')
    window.scrollTo(0, 0)
  }

  /** 장소 퀴즈: 학습 단계와 같은 난이도로 매번 새로 출제 */
  function startPlaceQuiz(place: Place, difficulty: Difficulty, from: 'learn' | 'home') {
    setSelectedPlace(place)
    startQuiz({
      title: `${place.name} 퀴즈 · ${difficulty}`,
      load: () => generateQuiz(place.id, difficulty),
      kind: 'place',
      place,
      from,
    })
  }

  /** 복습 퀴즈: 틀린 문제를 먼저, 모자라면 학습한 장소에서 새 문제를 섞는다 */
  function startReview() {
    const wrong = [...progress.wrongAnswers]
      .reverse()
      .slice(0, REVIEW_COUNT)
      .map(
        (entry): GeneratedQuiz => ({
          ...shuffleOptions(entry.item),
          placeId: entry.placeId,
          level: progress.defaultDifficulty,
          source: 'local',
        }),
      )
    const seen = wrong.map((item) => item.question)
    const extra: GeneratedQuiz[] = []
    for (let i = 0; wrong.length + extra.length < REVIEW_COUNT && i < 20 && completedIds.length > 0; i += 1) {
      const placeId = completedIds[Math.floor(Math.random() * completedIds.length)]
      const [item] = generateLocal(placeId, progress.defaultDifficulty, 1, [
        ...seen,
        ...extra.map((q) => q.question),
      ])
      if (item && ![...seen, ...extra.map((q) => q.question)].includes(item.question)) extra.push(item)
    }
    startQuiz({
      title: '복습 퀴즈',
      load: async () => [...wrong, ...extra],
      kind: 'review',
      from: 'home',
    })
  }

  function finishQuiz(results: QuizResult[], passed: boolean) {
    recordAnswers(results)
    if (quiz?.kind === 'place' && quiz.place) {
      if (passed) completeQuiz(quiz.place.id, positionFor(quiz.place))
      else completeLearning(quiz.place.id, positionFor(quiz.place))
    }
    if (quiz?.kind === 'review') {
      const fixed = results.filter((result) => result.correct).length
      showToast(`복습 완료! ${fixed}문제를 맞혔어요.`)
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
      {screen === 'login' && (
        <LoginScreen
          rememberedEmail={progress.rememberedEmail}
          onEnter={enter}
          onSignup={() => setScreen('signup')}
          onFindPassword={(email) => {
            setResetEmail(email)
            setScreen('reset')
          }}
        />
      )}
      {screen === 'signup' && (
        <SignupScreen
          onBack={() => setScreen('login')}
          onDone={(nickname) => {
            // 새로 가입한 계정은 닉네임을 채워 둔 온보딩부터 시작한다 (비밀번호는 저장하지 않는다)
            update({ loggedIn: true, nickname })
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
          onLearn={openLearn}
          onStartQuiz={(place) => startPlaceQuiz(place, progress.defaultDifficulty, 'home')}
          onStartReview={startReview}
          onLogin={() => setScreen('login')}
          onLogout={() => {
            update({ loggedIn: false })
            setScreen('login')
          }}
          onEditAvatar={() => setScreen('onboarding')}
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
          onToggleFavorite={() => toggleFavorite(selectedPlace.id)}
          onBack={() => setScreen('home')}
          onComplete={(difficulty) => {
            setLearnDifficulty(difficulty)
            completeLearning(selectedPlace.id, positionFor(selectedPlace))
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
          onBack={() =>
            setScreen(quiz.from === 'learn' && quiz.place && findPlace(quiz.place.id) ? 'learn' : 'home')
          }
          onDone={finishQuiz}
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
    </div>
  )
}
