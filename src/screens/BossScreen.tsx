import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { LevelPicker } from '../components/LevelPicker'
import {
  BOSS,
  BOSS_DAMAGE,
  BOSS_HEARTS,
  BOSS_MAX_PLAYERS,
  BOSS_MIN_PLAYERS,
  BOSS_NAME_MAX,
  BOSS_ROUNDS,
  BOSS_TIME_LIMIT,
  BOSS_WIN_XP,
  bossMaxHp,
  comboBonus,
} from '../data/boss'
import { bossQuestionPools, shuffleOptions } from '../lib/quizGenerator'
import type { Difficulty, QuizItem } from '../types'

// 함께하기 > 보스전(협동): 한 기기에서 2~4명이 번갈아 문제를 풀어 '까먹기 괴물'을 물리친다.
// - 차례마다 난이도를 고르고(어려울수록 큰 피해), 맞히면 보스에게 피해, 연속으로 맞히면 콤보로 더 큰 피해
// - 틀리거나 문제당 제한 시간이 다 되면 괴물이 반격해 팀 하트가 하나 줄고(화면이 흔들림), 하트가 0이면 진다
// - 피해 없이 다음 사람 차례. 모두가 한 번씩 풀면 1라운드, BOSS_ROUNDS 안에 쓰러뜨려야 한다
// - 문제는 앱의 퀴즈 문제만 쓰고, 한 판에서는 같은 문제가 다시 나오지 않는다
// - 이긴 뒤에는 함께한 사람 이름만 보여주고 순위는 매기지 않는다

type Phase = 'setup' | 'pick' | 'question' | 'feedback' | 'win' | 'fled' | 'lost'

const LEVELS: { level: Difficulty; hint: string }[] = [
  { level: '쉬움', hint: '가볍게 도전' },
  { level: '보통', hint: '조금 더 센 피해' },
  { level: '어려움', hint: '가장 큰 피해' },
]

export function BossScreen({ onWin, onExit }: { onWin: (xp: number) => void; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [names, setNames] = useState<string[]>(['', ''])
  const [players, setPlayers] = useState<string[]>([])
  /** 지금까지 푼 차례 수 (0부터). 라운드 = floor(turn / 사람 수) + 1 */
  const [turn, setTurn] = useState(0)
  const [hp, setHp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [question, setQuestion] = useState<QuizItem | null>(null)
  const [level, setLevel] = useState<Difficulty>('보통')
  const [picked, setPicked] = useState<number | null>(null)
  const [damage, setDamage] = useState(0)
  const [hearts, setHearts] = useState(BOSS_HEARTS)
  const [timeLeft, setTimeLeft] = useState(BOSS_TIME_LIMIT)
  const [timedOut, setTimedOut] = useState(false)
  /** 반격을 맞을 때마다 늘려서 흔들림을 다시 시작한다 */
  const [shakeKey, setShakeKey] = useState(0)
  const [hitKey, setHitKey] = useState(0)
  /** 이미 낸 문제 (같은 판에서 반복 금지) */
  const used = useRef(new Set<string>())
  const pools = useRef<ReturnType<typeof bossQuestionPools> | null>(null)

  const maxHp = bossMaxHp(players.length || names.length)
  const round = Math.floor(turn / Math.max(players.length, 1)) + 1
  const current = players[turn % Math.max(players.length, 1)]
  const cleaned = names.map((name) => name.trim())
  const filled = cleaned.every(Boolean)
  const unique = new Set(cleaned).size === cleaned.length
  const canStart = filled && unique

  function setName(index: number, value: string) {
    setNames((list) => list.map((name, i) => (i === index ? value.slice(0, BOSS_NAME_MAX) : name)))
  }

  function start() {
    if (!canStart) return
    used.current = new Set()
    pools.current = bossQuestionPools()
    setPlayers(cleaned)
    setHp(bossMaxHp(cleaned.length))
    setHearts(BOSS_HEARTS)
    setTurn(0)
    setStreak(0)
    setPicked(null)
    setPhase('pick')
  }

  /** 고른 난이도에서 아직 안 나온 문제를 뽑는다 (모자라면 다른 난이도에서 채운다) */
  function draw(chosen: Difficulty) {
    const all = pools.current ?? bossQuestionPools()
    const order: Difficulty[] = [chosen, ...(['보통', '쉬움', '어려움'] as Difficulty[]).filter((l) => l !== chosen)]
    for (const l of order) {
      const fresh = all[l].filter((item) => !used.current.has(item.question))
      if (fresh.length > 0) {
        const item = fresh[Math.floor(Math.random() * fresh.length)]
        used.current.add(item.question)
        return shuffleOptions(item)
      }
    }
    // 모든 문제를 다 썼다면 처음부터 다시 쓴다
    used.current = new Set()
    return draw(chosen)
  }

  function chooseLevel(chosen: Difficulty) {
    setLevel(chosen)
    setQuestion(draw(chosen))
    setPicked(null)
    setTimedOut(false)
    setTimeLeft(BOSS_TIME_LIMIT)
    setPhase('question')
  }

  // 문제를 푸는 동안 1초마다 시간이 줄어든다
  useEffect(() => {
    if (phase !== 'question') return
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [phase, question])

  // 시간이 다 되면 틀린 것과 똑같이 반격
  useEffect(() => {
    if (phase === 'question' && timeLeft <= 0) {
      setTimedOut(true)
      counterAttack()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  /** 틀렸거나 시간이 다 됐을 때: 콤보가 끊기고 괴물이 반격한다 */
  function counterAttack() {
    setStreak(0)
    setDamage(0)
    setHearts((value) => Math.max(0, value - 1))
    setShakeKey((key) => key + 1)
    setPhase('feedback')
  }

  function answer(option: number) {
    if (phase !== 'question' || picked !== null || !question) return
    setPicked(option)
    if (option === question.answer) {
      const nextStreak = streak + 1
      const dealt = BOSS_DAMAGE[level] + comboBonus(nextStreak)
      setStreak(nextStreak)
      setDamage(dealt)
      setHp((value) => Math.max(0, value - dealt))
      setHitKey((key) => key + 1)
      setPhase('feedback')
    } else {
      counterAttack()
    }
  }

  function next() {
    if (hp <= 0) {
      onWin(BOSS_WIN_XP)
      setPhase('win')
      return
    }
    if (hearts <= 0) {
      setPhase('lost')
      return
    }
    const nextTurn = turn + 1
    if (Math.floor(nextTurn / players.length) >= BOSS_ROUNDS) {
      setPhase('fled')
      return
    }
    setTurn(nextTurn)
    setPicked(null)
    setPhase('pick')
  }

  function retry() {
    setPhase('setup')
  }

  const hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 100
  const correct = picked !== null && question !== null && picked === question.answer

  return (
    <section
      className={`content-screen tab-screen avatar-screen boss-screen ${shakeKey > 0 ? `shake-${shakeKey % 2}` : ''}`}
    >
      <header className="avatar-subhead">
        <button className="icon-button plain" type="button" onClick={onExit} aria-label="보스전 나가기">
          <Icon name="arrow" />
        </button>
        <div>
          <p className="eyebrow">함께하기 · 협동</p>
          <h2>보스전</h2>
        </div>
        <span />
      </header>

      {phase === 'setup' && (
        <div className="boss-card">
          <div className="boss-face boss-face-big" style={{ background: BOSS.color }} aria-hidden="true">
            {BOSS.face}
          </div>
          <h3 className="boss-title">{BOSS.name}이 나타났어요!</h3>
          <p className="boss-text">
            {BOSS.intro} 함께할 친구 {BOSS_MIN_PLAYERS}~{BOSS_MAX_PLAYERS}명의 이름을 적고, 번갈아 문제를 풀어
            물리쳐요. {BOSS_ROUNDS}라운드 안에 쓰러뜨려야 해요.
          </p>
          <div className="boss-names">
            {names.map((name, index) => (
              <div key={index} className="boss-name-row">
                <input
                  type="text"
                  value={name}
                  maxLength={BOSS_NAME_MAX}
                  placeholder={`${index + 1}번째 친구 이름`}
                  aria-label={`${index + 1}번째 친구 이름`}
                  onChange={(event) => setName(index, event.target.value)}
                />
                {names.length > BOSS_MIN_PLAYERS && (
                  <button
                    type="button"
                    aria-label={`${index + 1}번째 친구 빼기`}
                    onClick={() => setNames((list) => list.filter((_, i) => i !== index))}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {names.length < BOSS_MAX_PLAYERS && (
            <button type="button" className="boss-add" onClick={() => setNames((list) => [...list, ''])}>
              <Icon name="plus" size={16} /> 친구 더하기
            </button>
          )}
          {filled && !unique && <p className="boss-warn">이름이 서로 달라야 해요.</p>}
          <p className="boss-note">
            친구가 {names.length}명이라 {BOSS.name}의 체력은 {bossMaxHp(names.length)}이에요.
          </p>
          <button type="button" className="boss-primary" disabled={!canStart} onClick={start}>
            보스전 시작!
          </button>
        </div>
      )}

      {phase !== 'setup' && (
        <>
          <div className="boss-stage">
            <div className="boss-status">
              <span>
                라운드 {Math.min(round, BOSS_ROUNDS)} / {BOSS_ROUNDS}
              </span>
              {streak >= 2 && <strong className="boss-combo">{streak}콤보!</strong>}
              <span className="boss-hearts" role="img" aria-label={`팀 하트 ${hearts}개`}>
                {Array.from({ length: BOSS_HEARTS }, (_, i) => (i < hearts ? '❤️' : '🤍')).join('')}
              </span>
            </div>
            <div
              key={hitKey}
              className={`boss-face ${hitKey > 0 && phase === 'feedback' && correct ? 'hit' : ''} ${phase === 'win' ? 'defeated' : ''}`}
              style={{ background: BOSS.color }}
              aria-label={BOSS.name}
              role="img"
            >
              {BOSS.face}
            </div>
            <p className="boss-name">{BOSS.name}</p>
            <div className="hp-track boss-hp">
              <i style={{ width: `${hpPercent}%` }} />
            </div>
            <small className="boss-hp-text">
              체력 {hp} / {maxHp}
            </small>
          </div>

          <div className="battle-question-card boss-panel">
            {phase === 'pick' && (
              <>
                <h3 className="boss-turn">{current} 차례!</h3>
                <p className="boss-text">도전할 난이도를 골라요. 어려울수록 피해가 커요.</p>
                <LevelPicker
                  onPick={chooseLevel}
                  items={LEVELS.map(({ level: l, hint }) => ({
                    level: l,
                    hint,
                    tag: `피해 ${BOSS_DAMAGE[l]}`,
                  }))}
                />
              </>
            )}

            {(phase === 'question' || phase === 'feedback') && question && (
              <>
                <h3 className="boss-turn small">{current} 차례!</h3>
                <div className="boss-timer" role="timer" aria-label={`남은 시간 ${timeLeft}초`}>
                  <div className="boss-timer-track">
                    <i
                      className={timeLeft <= 5 ? 'low' : ''}
                      style={{ width: `${(timeLeft / BOSS_TIME_LIMIT) * 100}%` }}
                    />
                  </div>
                  <strong>{timeLeft}초</strong>
                </div>
                <span className="battle-question-label">{level} 문제</span>
                <h3>{question.question}</h3>
                <div className="battle-answers">
                  {question.options.map((option, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => answer(index)}
                      disabled={phase !== 'question'}
                      className={
                        phase === 'question'
                          ? ''
                          : index === question.answer
                            ? 'correct'
                            : index === picked
                              ? 'wrong'
                              : ''
                      }
                    >
                      <span>{index + 1}</span>
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}

            {phase === 'feedback' && question && (
              <div className="boss-feedback" role="status">
                <p className={correct ? 'good' : 'bad'}>
                  {correct
                    ? `정답! ${BOSS.name}에게 ${damage}의 피해! ${BOSS.hitLine}${streak >= 2 ? ` (${streak}콤보)` : ''}`
                    : `${timedOut ? `${BOSS.timeoutLine} ` : ''}${BOSS.counterLine} (하트 ${hearts}개 남음) 정답은 ‘${question.options[question.answer]}’.`}
                </p>
                {question.note && <small>{question.note}</small>}
                <button type="button" className="boss-primary" onClick={next}>
                  {hp <= 0 || hearts <= 0 ? '결과 보기' : `다음 차례 (${players[(turn + 1) % players.length]})`}
                </button>
              </div>
            )}

            {phase === 'win' && (
              <div className="boss-end win">
                <p className="boss-end-emoji" aria-hidden="true">
                  🎉
                </p>
                <h3>{BOSS.winTitle}</h3>
                <p className="boss-text">{BOSS.winText}</p>
                <div className="boss-crew" aria-label="함께한 친구들">
                  {players.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
                <p className="boss-reward">경험치 +{BOSS_WIN_XP} · 배지 ‘함께 물리친 괴물’</p>
                <div className="boss-end-actions">
                  <button type="button" className="boss-primary" onClick={retry}>
                    <Icon name="refresh" size={16} /> 다시 하기
                  </button>
                  <button type="button" onClick={onExit}>
                    함께하기로 <Icon name="chevron" size={16} />
                  </button>
                </div>
              </div>
            )}

            {phase === 'lost' && (
              <div className="boss-end fled">
                <p className="boss-end-emoji" aria-hidden="true">
                  😵
                </p>
                <h3>{BOSS.loseTitle}</h3>
                <p className="boss-text">{BOSS.loseText}</p>
                <div className="boss-end-actions">
                  <button type="button" className="boss-primary" onClick={retry}>
                    <Icon name="refresh" size={16} /> 다시 도전
                  </button>
                  <button type="button" onClick={onExit}>
                    함께하기로 <Icon name="chevron" size={16} />
                  </button>
                </div>
              </div>
            )}

            {phase === 'fled' && (
              <div className="boss-end fled">
                <p className="boss-end-emoji" aria-hidden="true">
                  💨
                </p>
                <h3>{BOSS.fledTitle}</h3>
                <p className="boss-text">{BOSS.fledText}</p>
                <div className="boss-end-actions">
                  <button type="button" className="boss-primary" onClick={retry}>
                    <Icon name="refresh" size={16} /> 다시 도전
                  </button>
                  <button type="button" onClick={onExit}>
                    함께하기로 <Icon name="chevron" size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
