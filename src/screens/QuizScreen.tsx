import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { levelFor, XP_PER_CORRECT } from '../data/avatar'
import type { GeneratedQuiz } from '../lib/quizGenerator'

/** 이 비율 이상 맞히면 '퀴즈 완료'로 기록 */
const PASS_RATIO = 2 / 3

/** retried: 쉬움 단계에서 힌트를 보고 다시 골라 맞혔는지 (경험치 절반) */
type QuizResult = { placeId: string; item: GeneratedQuiz; correct: boolean; retried: boolean }

/** 문제 하나로 얻는 경험치 */
const xpOf = (result: QuizResult) =>
  result.correct ? XP_PER_CORRECT[result.item.level] / (result.retried ? 2 : 1) : 0

// 장소 퀴즈 화면
// load: 문제를 만들어 오는 함수 — AI 또는 기기 안 자동 생성
// 쉬움 단계는 틀리면 힌트 한 줄을 보여 주고 한 번 더 고를 수 있다 (O/X 제외)
export function QuizScreen({
  title,
  load,
  xp,
  onXp,
  onBack,
  onDone,
}: {
  title: string
  load: () => Promise<GeneratedQuiz[]>
  /** 지금 경험치 (결과 화면에서 레벨이 올랐는지 보여준다) */
  xp: number
  /** 퀴즈를 다 풀면 얻은 경험치를 한 번 알린다 */
  onXp: (amount: number) => void
  onBack: () => void
  /** passed: 기준 이상 맞혔는지 여부 */
  onDone: (passed: boolean) => void
}) {
  /** 이번 판을 시작할 때의 경험치 */
  const startXp = useRef(xp)
  /** 쉬움 단계에서 틀려서 힌트를 본 보기 */
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const [quizItems, setQuizItems] = useState<GeneratedQuiz[] | null>(null)
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [finished, setFinished] = useState(false)

  // 다 풀면 얻은 경험치를 한 번만 더한다
  useEffect(() => {
    if (finished) onXp(results.reduce((sum, result) => sum + xpOf(result), 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  useEffect(() => {
    let alive = true
    setQuizItems(null)
    load().then((items) => alive && setQuizItems(items))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  if (!quizItems) {
    return (
      <main className="screen quiz-screen quiz-loading">
        <div className="quiz-loader">
          <Icon name="sparkle" size={30} />
        </div>
        <h1>문제를 만들고 있어요</h1>
        <p>학습한 내용을 바탕으로 새로운 문제를 준비 중이에요.</p>
      </main>
    )
  }

  if (quizItems.length === 0) {
    return (
      <main className="screen quiz-screen quiz-loading">
        <h1>낼 문제가 없어요</h1>
        <p>역사 장소를 먼저 학습해 주세요.</p>
        <ActionButton onClick={onBack}>돌아가기</ActionButton>
      </main>
    )
  }

  const items = quizItems
  const current = items[index]
  const score = results.filter((result) => result.correct).length

  const canRetry = current.level === '쉬움' && Boolean(current.hint) && current.options.length > 2

  function choose(option: number) {
    if (selected !== null || option === wrongPick) return
    const correct = option === current.answer
    // 쉬움: 처음 틀리면 힌트를 보여 주고 한 번 더 고를 기회를 준다
    if (!correct && canRetry && wrongPick === null) {
      setWrongPick(option)
      return
    }
    setSelected(option)
    setResults((list) => [
      ...list,
      { placeId: current.placeId, item: current, correct, retried: wrongPick !== null },
    ])
  }

  function next() {
    if (index === items.length - 1) {
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setSelected(null)
    setWrongPick(null)
  }

  if (finished) {
    const passed = score >= Math.ceil(quizItems.length * PASS_RATIO)
    const gained = results.reduce((sum, result) => sum + xpOf(result), 0)
    const levelBefore = levelFor(startXp.current)
    const levelAfter = levelFor(startXp.current + gained)
    return (
      <main className="screen quiz-screen result-screen">
        <div className="result-ornament">
          <span />
          <Icon name="sparkle" size={34} />
          <span />
        </div>
        <p className="eyebrow">{title} 완료</p>
        <h1>{passed ? '멋진 탐험이었어요!' : '조금만 더 해볼까요?'}</h1>
        <p>
          {passed
            ? '배운 내용을 아주 잘 기억하고 있네요.'
            : '학습 내용을 다시 읽고 도전하면 퀴즈 완료로 기록돼요.'}
        </p>
        <div className="score-ring">
          <div>
            <strong>{score}</strong>
            <span>/ {quizItems.length}</span>
          </div>
          <small>정답</small>
        </div>
        <div className="result-card">
          <div>
            <span>얻은 경험치</span>
            <strong>+ {gained} XP</strong>
          </div>
          <div>
            <span>정답률</span>
            <strong>{Math.round((score / quizItems.length) * 100)}%</strong>
          </div>
        </div>
        <p className="result-level">
          {levelAfter > levelBefore
            ? `레벨이 올랐어요! Lv. ${levelBefore} → Lv. ${levelAfter}`
            : `지금 Lv. ${levelAfter} · 맞힌 문제마다 ${XP_PER_CORRECT[quizItems[0].level]} XP`}
        </p>
        <ActionButton onClick={() => onDone(passed)}>
          {passed ? '퀴즈 완료하고 지도 보기' : '지도로 돌아가기'}
        </ActionButton>
        <ActionButton
          variant="ghost"
          onClick={() => {
            startXp.current = startXp.current + gained
            setResults([])
            setIndex(0)
            setSelected(null)
            setWrongPick(null)
            setFinished(false)
            setRound((value) => value + 1)
          }}
        >
          새 문제로 다시 풀기
        </ActionButton>
      </main>
    )
  }

  return (
    <main className="screen quiz-screen">
      <header className="quiz-header">
        <button className="icon-button plain" onClick={onBack} type="button" aria-label="뒤로 가기">
          <Icon name="arrow" />
        </button>
        <div>
          <span>{title}</span>
          <strong>
            {index + 1} / {quizItems.length}
          </strong>
        </div>
        <span className="quiz-xp">
          {current.source === 'ai' ? 'AI 출제' : '자동 출제'} · {current.level}
        </span>
      </header>
      <div className="quiz-progress">
        <span style={{ width: `${((index + 1) / quizItems.length) * 100}%` }} />
      </div>
      <section className="quiz-body">
        <div className="question-badge">문제 {String(index + 1).padStart(2, '0')}</div>
        <h1>{current.question}</h1>
        <p>{current.options.length === 2 ? '옳으면 O, 틀리면 X를 골라주세요.' : '하나를 선택해 주세요.'}</p>
        <div className="answer-list">
          {current.options.map((option, optionIndex) => {
            const resultClass =
              selected === null
                ? optionIndex === wrongPick
                  ? 'wrong'
                  : ''
                : optionIndex === current.answer
                  ? 'correct'
                  : optionIndex === selected
                    ? 'wrong'
                    : 'muted'
            return (
              <button
                type="button"
                key={`${index}-${optionIndex}`}
                className={resultClass}
                disabled={selected === null && optionIndex === wrongPick}
                onClick={() => choose(optionIndex)}
              >
                <span>{optionIndex + 1}</span>
                <strong>{option}</strong>
                {resultClass === 'correct' && (
                  <i>
                    <Icon name="check" size={18} />
                  </i>
                )}
                {resultClass === 'wrong' && (
                  <i>
                    <Icon name="close" size={18} />
                  </i>
                )}
              </button>
            )
          })}
        </div>
        {/* 쉬움: 처음 틀리면 힌트 한 줄과 함께 한 번 더 */}
        {selected === null && wrongPick !== null && (
          <div className="feedback hint" role="status">
            <span>
              <Icon name="sparkle" size={19} />
            </span>
            <div>
              <strong>힌트를 보고 한 번 더 골라 볼까요?</strong>
              <p>{current.hint}</p>
            </div>
          </div>
        )}
        {selected !== null && (
          <div className={`feedback ${selected === current.answer ? 'correct' : 'wrong'}`}>
            <span>
              <Icon name={selected === current.answer ? 'check' : 'refresh'} size={19} />
            </span>
            <div>
              <strong>{selected === current.answer ? '정답이에요!' : '아쉬워요, 정답을 확인해 봐요.'}</strong>
              <p>{current.note}</p>
            </div>
          </div>
        )}
      </section>
      <div className="quiz-action">
        <ActionButton disabled={selected === null} onClick={next}>
          {index === quizItems.length - 1 ? '결과 확인하기' : '다음 문제'} <Icon name="chevron" size={19} />
        </ActionButton>
      </div>
    </main>
  )
}
