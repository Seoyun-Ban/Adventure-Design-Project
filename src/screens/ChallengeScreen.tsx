import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { AuthLayout } from '../components/AuthHeader'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { ChallengeShareButton } from '../components/ChallengeShareButton'
import { defaultLook, powerOf } from '../data/avatar'
import type { Challenger } from '../lib/challenge'
import { BattleScreen } from './BattleScreen'

// 친구가 보낸 도전장 링크를 열었을 때: 도착 화면 → 턴제 대결 → 결과 + 답장 도전장
// 아직 아바타를 만들지 않은 사람(me 없음)은 기본 캐릭터로 바로 대결하고, 끝난 뒤 시작하기를 안내한다.
export function ChallengeScreen({
  challenge,
  me,
  placeIds,
  onFinish,
  onStart,
  onClose,
  onNotice,
}: {
  /** 링크에서 읽은 도전장. ok가 false면 망가진 링크 */
  challenge: { ok: true; challenger: Challenger } | { ok: false }
  /** 링크를 연 사람의 아바타. 아직 만들지 않았으면 null */
  me: Challenger | null
  /** 문제를 낼 장소 */
  placeIds: string[]
  onFinish: (opponent: string, won: boolean) => void
  /** 시작하기 (로그인·온보딩으로) */
  onStart: () => void
  /** 홈으로 */
  onClose: () => void
  onNotice: (message: string) => void
}) {
  const [view, setView] = useState<'invite' | 'battle'>('invite')
  const [round, setRound] = useState(0)
  const leave = me ? onClose : onStart

  if (!challenge.ok) {
    return (
      <AuthLayout>
        <section className="login-panel auth-done challenge-card">
          <span className="auth-done-icon challenge-broken">
            <Icon name="close" size={30} />
          </span>
          <h1>도전장을 읽을 수 없어요</h1>
          <p>
            링크가 잘렸거나 바뀌었을 수 있어요.
            <br />
            친구에게 도전장을 다시 보내 달라고 해 보세요.
          </p>
          <ActionButton onClick={leave}>{me ? '홈으로' : '시작하기'}</ActionButton>
        </section>
      </AuthLayout>
    )
  }

  const { challenger } = challenge
  const opponent = { ...challenger, name: challenger.nickname }
  const fighter = me ?? { nickname: '나', look: defaultLook, equipped: {}, level: 1 }

  if (view === 'battle') {
    return (
      <div className="challenge-battle">
        <BattleScreen
          key={round}
          me={fighter}
          opponent={opponent}
          placeIds={placeIds}
          onFinish={(won) => onFinish(`${challenger.nickname} (도전장)`, won)}
          onRetry={() => setRound((value) => value + 1)}
          onExit={leave}
          exitLabel={me ? '홈으로' : '시작하기'}
          overExtra={
            me ? (
              <ChallengeShareButton me={me} label="답장 도전장 보내기" onNotice={onNotice} />
            ) : (
              <>
                <button
                  type="button"
                  className="challenge-share"
                  onClick={() => {
                    onNotice('나만의 아바타를 만들면 답장 도전장을 보낼 수 있어요.')
                    onStart()
                  }}
                >
                  <Icon name="quiz" size={18} /> 답장 도전장 보내기
                </button>
                <p className="auth-note">'시작하기'로 나만의 아바타를 만들면 답장 도전장을 보낼 수 있어요.</p>
              </>
            )
          }
        />
      </div>
    )
  }

  return (
    <AuthLayout>
      <section className="login-panel auth-done challenge-card">
        <p className="eyebrow">역사 지식 대결</p>
        <h1>{challenger.nickname}의 도전장이 도착했어요!</h1>
        <div className="challenge-avatar">
          <CharacterAvatar
            className="stage-avatar"
            look={challenger.look}
            equipped={challenger.equipped}
            label={`${challenger.nickname}의 아바타`}
          />
        </div>
        <p className="challenge-stats">
          Lv. {challenger.level} · 전투력{' '}
          {powerOf(challenger.equipped, challenger.level).total.toLocaleString()}
        </p>
        <p>
          역사 문제를 맞혀 공격하고, 상대의 체력을 먼저 0으로 만들면 이겨요.
          {!me && (
            <>
              <br />
              가입하지 않아도 바로 대결할 수 있어요.
            </>
          )}
        </p>
        <ActionButton onClick={() => setView('battle')}>
          도전 받기 <Icon name="chevron" size={18} />
        </ActionButton>
        <ActionButton variant="ghost" onClick={leave}>
          {me ? '다음에 할게요' : '먼저 시작하기'}
        </ActionButton>
      </section>
    </AuthLayout>
  )
}
