import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { LevelPicker } from '../components/LevelPicker'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { powerOf } from '../data/avatar'
import { BATTLE_LEVELS } from '../data/battle'
import { randomBattleQuestion } from '../lib/quizGenerator'
import { withJosa } from '../lib/korean'
import type { AvatarLook, Difficulty, Equipped, QuizItem } from '../types'

// 친구와 역사 지식 대결 (턴제)
// 1) 내 차례: 난이도(쉬움/보통/어려움)를 고르고 무작위 문제를 맞히면 '공격' 또는 '방어'를 고른다. 어려운 문제일수록 공격이 세고 방어도 많이 막는다(data/battle.ts). 틀리면 아무것도 못 한다.
// 2) 상대 차례: 상대가 공격한다. 공격력은 상대의 의상(아이템)과 레벨(학습량)로 정해진다.
// 3) 먼저 체력이 0이 되는 쪽이 진다. 끝나면 승패 모션을 보여주고 결과를 한 번만 기록한다.

type Fighter = { nickname: string; look: AvatarLook; equipped: Equipped; level: number }
type Opponent = { name: string; level: number; look: AvatarLook; equipped: Equipped }
/** resolve: 내 공격·방어 결과를 보여주는 중 (버튼을 숨겨 두 번 누르지 못하게 한다) */
type Phase = 'pick' | 'question' | 'choose' | 'resolve' | 'enemy' | 'over'

const MAX_HP = 100
/** 마지막 공격 흔들림이 끝난 뒤 승패 모션을 시작할 때까지 (ms) */
const RESULT_DELAY = 500
/** 꽃가루 조각 수 */
const CONFETTI = 18

/** 공격 피해: 전투력 기반에 난이도 배수(mult)를 곱한다 */
const attackDamage = (p: number, mult = 1) => Math.round((12 + p / 45 + Math.random() * 6) * mult)

export function BattleScreen({
  me,
  opponent,
  onFinish,
  onRetry,
  onExit,
  exitLabel = '친구 목록으로',
  overExtra,
}: {
  me: Fighter
  opponent: Opponent
  /** 끝난 뒤 나가기 버튼 이름 */
  exitLabel?: string
  /** 끝난 뒤 버튼 아래에 더 보여줄 것 (예: 답장 도전장 보내기) */
  overExtra?: ReactNode
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
  const [phase, setPhase] = useState<Phase>('pick')
  const [level, setLevel] = useState<Difficulty>('보통')
  const [question, setQuestion] = useState<QuizItem>(() => randomBattleQuestion())
  const [picked, setPicked] = useState<number | null>(null)
  /** 방어 중이면 다음 공격을 막는 비율 (0이면 방어 안 함) */
  const [guard, setGuardState] = useState(0)
  const shield = guard > 0
  // 상대 차례는 시간 예약(setTimeout) 안에서 실행되므로, 방어 비율은 ref로도 들고 있어야 최신 값을 읽는다
  const guardRef = useRef(0)
  function setGuard(value: number) {
    guardRef.current = value
    setGuardState(value)
  }
  const [log, setLog] = useState('난이도를 골라 도전하세요!')
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

  function chooseLevel(chosen: Difficulty) {
    if (phase !== 'pick') return
    setLevel(chosen)
    setQuestion((prev) => randomBattleQuestion(prev.question, chosen))
    setPicked(null)
    setLog('문제를 맞혀 공격하거나 방어하세요!')
    setPhase('question')
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
      const damage = attackDamage(myPower, BATTLE_LEVELS[level].attack)
      const next = Math.max(0, hpRef.current.enemy - damage)
      setHp('enemy', next)
      setHit('enemy')
      setLog(`공격 성공! ${opponent.name}에게 ${damage}의 피해를 주었어요.`)
      if (next <= 0) return finish(true)
    } else {
      const { heal, block } = BATTLE_LEVELS[level]
      setGuard(block)
      setHp('me', Math.min(MAX_HP, hpRef.current.me + heal))
      setLog(`방어 자세! 체력을 ${heal} 회복하고 다음 공격의 ${Math.round(block * 100)}%를 막아요.`)
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
        const damage = Math.round(raw * (1 - guardRef.current))
        const next = Math.max(0, hpRef.current.me - damage)
        setHp('me', next)
        setHit('me')
        setLog(
          guardRef.current > 0
            ? `방어 성공! ${damage}의 피해만 받았어요.`
            : `${opponent.name}의 공격! ${damage}의 피해를 받았어요.`,
        )
        if (next <= 0) return finish(false)
      } else {
        setLog(`${withJosa(opponent.name, '이')} 문제를 틀려 공격하지 못했어요.`)
      }
      setGuard(0)
      later(() => {
        setHit(null)
        setTurn((value) => value + 1)
        setPicked(null)
        setLog('난이도를 골라 도전하세요!')
        setPhase('pick')
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
    setGuard(0)
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
        {phase === 'pick' && (
          <>
            <span className="battle-question-label">내 차례 · 난이도 고르기</span>
            <p className="battle-pick-help">어려운 문제를 맞힐수록 공격이 세고, 방어도 더 많이 막아요.</p>
            <LevelPicker
              onPick={chooseLevel}
              items={(['쉬움', '보통', '어려움'] as Difficulty[]).map((l) => ({
                level: l,
                hint: `체력 +${BATTLE_LEVELS[l].heal} · ${Math.round(BATTLE_LEVELS[l].block * 100)}% 막기`,
                tag: `공격 ×${BATTLE_LEVELS[l].attack}`,
              }))}
            />
          </>
        )}
        {phase === 'question' && (
          <>
            <span className="battle-question-label">{level} 문제</span>
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
              <span>약 {Math.round((15 + myPower / 45) * BATTLE_LEVELS[level].attack)} 피해</span>
            </button>
            <button type="button" className="defend" onClick={() => act('defend')}>
              <strong>방어</strong>
              <span>
                체력 +{BATTLE_LEVELS[level].heal}, 다음 공격 {Math.round(BATTLE_LEVELS[level].block * 100)}% 막기
              </span>
            </button>
          </div>
        )}
        {over && (
          <div className="battle-over-actions">
            <button type="button" className="retry" onClick={onRetry}>
              <Icon name="refresh" size={17} /> 다시 도전
            </button>
            <button type="button" onClick={onExit}>
              {exitLabel} <Icon name="chevron" size={16} />
            </button>
          </div>
        )}
        {over && overExtra}
      </div>
    </section>
  )
}
