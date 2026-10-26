import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { powerOf } from '../data/avatar'
import { randomBattleQuestion } from '../lib/quizGenerator'
import { withJosa } from '../lib/korean'
import type { AvatarLook, Equipped, QuizItem } from '../types'

// 친구와 역사 지식 대결 (턴제)
// 1) 내 차례: 무작위 문제를 맞히면 '공격' 또는 '방어'를 고른다. 틀리면 아무것도 못 한다.
// 2) 상대 차례: 상대가 공격한다. 공격력은 상대의 의상(아이템)과 레벨(학습량)로 정해진다.
// 3) 먼저 체력이 0이 되는 쪽이 진다. 끝나면 승패 모션을 보여주고 결과를 한 번만 기록한다.

type Fighter = { nickname: string; look: AvatarLook; equipped: Equipped; level: number }
type Opponent = { name: string; level: number; look: AvatarLook; equipped: Equipped }
/** resolve: 내 공격·방어 결과를 보여주는 중 (버튼을 숨겨 두 번 누르지 못하게 한다) */
type Phase = 'question' | 'choose' | 'resolve' | 'enemy' | 'over'

const MAX_HP = 100
/** 마지막 공격 흔들림이 끝난 뒤 승패 모션을 시작할 때까지 (ms) */
const RESULT_DELAY = 500
/** 꽃가루 조각 수 */
const CONFETTI = 18

const attackDamage = (p: number) => Math.round(12 + p / 45 + Math.random() * 6)

export function BattleScreen({
  me,
  opponent,
  onFinish,
  onRetry,
  onExit,
}: {
  me: Fighter
  opponent: Opponent
  /** 대결이 끝났을 때 한 번 불린다 (기록 저장) */
  onFinish: (won: boolean) => void
  /** 같은 친구와 다시 대결 */
  onRetry: () => void
  onExit: () => void
}) {
  const myPower = powerOf(me.equipped, me.level).total
  const enemyPower = powerOf(opponent.equipped, opponent.level).total
  const [myHp, setMyHp] = useState(MAX_HP)
  const [enemyHp, setEnemyHp] = useState(MAX_HP)
  const [turn, setTurn] = useState(1)
  const [phase, setPhase] = useState<Phase>('question')
  const [question, setQuestion] = useState<QuizItem>(() => randomBattleQuestion())
  const [picked, setPicked] = useState<number | null>(null)
  const [shield, setShield] = useState(false)
  const [log, setLog] = useState('문제를 맞혀 공격하거나 방어하세요!')
  const [hit, setHit] = useState<'me' | 'enemy' | null>(null)
  /** 승패 모션 (마지막 공격 뒤 잠깐 있다가 시작) */
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  // 체력은 화면용 state와 판단용 ref를 함께 둔다 (끝났는지 판단·기록이 한 번만 일어나게)
  const hpRef = useRef({ me: MAX_HP, enemy: MAX_HP })
  const timers = useRef<number[]>([])
  const finished = useRef(false)

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const over = phase === 'over'

  function setHp(side: 'me' | 'enemy', value: number) {
    hpRef.current[side] = value
    if (side === 'me') setMyHp(value)
    else setEnemyHp(value)
  }

  function answer(option: number) {
    if (phase !== 'question' || picked !== null) return
    setPicked(option)
    if (option === question.answer) {
      setLog('정답! 공격할까요, 방어할까요?')
      later(() => setPhase('choose'), 500)
    } else {
      setLog(`오답이에요. 정답은 ‘${question.options[question.answer]}’. 이번 차례는 넘어가요.`)
      later(enemyTurn, 1400)
    }
  }

  function act(kind: 'attack' | 'defend') {
    if (phase !== 'choose') return
    setPhase('resolve')
    if (kind === 'attack') {
      const damage = attackDamage(myPower)
      const next = Math.max(0, hpRef.current.enemy - damage)
      setHp('enemy', next)
      setHit('enemy')
      setLog(`공격 성공! ${opponent.name}에게 ${damage}의 피해를 주었어요.`)
      if (next <= 0) return finish(true)
    } else {
      setShield(true)
      setHp('me', Math.min(MAX_HP, hpRef.current.me + 8))
      setLog('방어 자세! 체력을 8 회복하고 다음 공격을 막아요.')
    }
    later(enemyTurn, 1300)
  }

  function enemyTurn() {
    setHit(null)
    setPhase('enemy')
    setLog(`${opponent.name}의 차례…`)
    later(() => {
      // 상대 정답률: 레벨이 높을수록 잘 맞힌다
      const accuracy = Math.min(0.9, 0.5 + opponent.level * 0.06)
      if (Math.random() < accuracy) {
        const raw = attackDamage(enemyPower)
        const damage = shield ? Math.round(raw * 0.3) : raw
        const next = Math.max(0, hpRef.current.me - damage)
        setHp('me', next)
        setHit('me')
        setLog(
          shield
            ? `방어 성공! ${damage}의 피해만 받았어요.`
            : `${opponent.name}의 공격! ${damage}의 피해를 받았어요.`,
        )
        if (next <= 0) return finish(false)
      } else {
        setLog(`${withJosa(opponent.name, '이')} 문제를 틀려 공격하지 못했어요.`)
      }
      setShield(false)
      later(() => {
        setHit(null)
        setTurn((value) => value + 1)
        setQuestion((prev) => randomBattleQuestion(prev.question))
        setPicked(null)
        setPhase('question')
      }, 1500)
    }, 1100)
  }

  function finish(meWon: boolean) {
    if (finished.current) return
    finished.current = true
    // 아직 남은 '다음 차례' 예약을 모두 취소해 끝난 상태가 되돌아가지 않게 한다
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    setPhase('over')
    setShield(false)
    setLog(meWon ? '역사 지식으로 대결에서 이겼어요.' : '아쉽게 졌어요. 학습으로 전투력을 키워 봐요.')
    onFinish(meWon)
    later(() => {
      setHit(null)
      setResult(meWon ? 'win' : 'lose')
    }, RESULT_DELAY)
  }

  return (
    <section className="content-screen tab-screen avatar-screen battle-screen">
      <header className="battle-header">
        <button className="icon-button plain" type="button" onClick={onExit} aria-label="대결 나가기">
          <Icon name="arrow" />
        </button>
        <div>
          <span>역사 지식 대결</span>
          <strong>TURN {turn}</strong>
        </div>
        <span className="battle-live">{phase === 'enemy' ? '상대 차례' : over ? '종료' : '내 차례'}</span>
      </header>
      <div className={`battle-arena ${result ? `result-${result}` : ''}`}>
        {result === 'win' && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: CONFETTI }, (_, index) => (
              <i key={index} style={{ '--i': index } as CSSProperties} />
            ))}
          </div>
        )}
        {result && (
          <p className={`battle-result-banner ${result}`} role="status">
            {result === 'win' ? '승리!' : '다음엔 이길 수 있어요!'}
          </p>
        )}
        <div className={`fighter enemy ${hit === 'enemy' ? 'hit' : ''}`}>
          <div className="fighter-name">
            <span>{opponent.name}</span>
            <strong>전투력 {enemyPower.toLocaleString()}</strong>
          </div>
          <div className="hp-track">
            <i style={{ width: `${enemyHp}%` }} />
          </div>
          <small>
            HP {enemyHp}/{MAX_HP}
          </small>
          <CharacterAvatar
            className="fighter-avatar enemy-avatar"
            look={opponent.look}
            equipped={opponent.equipped}
            label={`${opponent.name}의 아바타`}
          />
        </div>
        <div className="versus">VS</div>
        <div className={`fighter player ${hit === 'me' ? 'hit' : ''} ${shield ? 'shielded' : ''}`}>
          <CharacterAvatar
            className="fighter-avatar"
            look={me.look}
            equipped={me.equipped}
            label="나의 아바타"
          />
          <div className="fighter-name">
            <span>{me.nickname}</span>
            <strong>전투력 {myPower.toLocaleString()}</strong>
          </div>
          <div className="hp-track">
            <i style={{ width: `${myHp}%` }} />
          </div>
          <small>
            HP {myHp}/{MAX_HP}
            {shield ? ' · 방어 중' : ''}
          </small>
        </div>
      </div>
      <div className="battle-question-card">
        <p className="battle-log" role="status">
          {log}
        </p>
        {phase === 'question' && (
          <>
            <span className="battle-question-label">공격 문제</span>
            <h3>{question.question}</h3>
            <div className="battle-answers">
              {question.options.map((option, index) => (
                <button
                  type="button"
                  key={`${turn}-${index}`}
                  onClick={() => answer(index)}
                  disabled={picked !== null}
                  className={
                    picked === null
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
        {phase === 'choose' && (
          <div className="battle-choice">
            <button type="button" className="attack" onClick={() => act('attack')}>
              <strong>공격</strong>
              <span>약 {attackDamage(myPower) - 3} 피해</span>
            </button>
            <button type="button" className="defend" onClick={() => act('defend')}>
              <strong>방어</strong>
              <span>체력 +8, 다음 공격 70% 막기</span>
            </button>
          </div>
        )}
        {over && (
          <div className="battle-over-actions">
            <button type="button" className="retry" onClick={onRetry}>
              <Icon name="refresh" size={17} /> 다시 도전
            </button>
            <button type="button" onClick={onExit}>
              친구 목록으로 <Icon name="chevron" size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
