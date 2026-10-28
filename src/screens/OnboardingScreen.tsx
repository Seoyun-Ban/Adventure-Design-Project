import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { Avatar } from '../components/Avatar'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { FacePhotoField } from '../components/FacePhotoField'
import { LookFields, OptionRow } from '../components/OptionRow'
import { skinTones } from '../data/avatar'
import type { AvatarLook, Difficulty, Equipped } from '../types'

// 처음 이용할 때 한 번 거치는 설정 화면
// 1) 닉네임·성별·머리 모양  2) 얼굴 등록  3) 기본 학습 단계

/**
 * SVG 캐릭터용 체형·머리·피부색 선택을 보여줄지.
 * 그림 캐릭터는 성별과 머리 모양(characterStyles)만 반영되므로 꺼 둔다.
 * 체형·피부색별 그림이 생기면 true로 바꾸고, CharacterAvatar가 그 선택을 쓰도록 고치면 된다.
 * true로 바꾸면 지금은 미리보기가 선택이 반영되는 SVG 캐릭터로 나온다.
 */
const SHOW_DETAILED_LOOK = false
export function OnboardingScreen({
  initial,
  equipped,
  onDone,
}: {
  initial: { nickname: string; look: AvatarLook; faceImage?: string; defaultDifficulty: Difficulty }
  equipped: Equipped
  onDone: (result: {
    nickname: string
    look: AvatarLook
    faceImage?: string
    defaultDifficulty: Difficulty
  }) => void
}) {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState(initial.nickname)
  const [look, setLook] = useState<AvatarLook>(initial.look)
  const [faceImage, setFaceImage] = useState<string | undefined>(initial.faceImage)
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.defaultDifficulty)

  const titles = ['나만의 탐험가 만들기', '얼굴 등록하기', '학습 단계 고르기']
  const subtitles = [
    '역사 여행을 함께할 아바타의 모습을 골라주세요.',
    '찍은 얼굴은 학습 영상 속 역사 현장에 함께 등장해요.',
    '나중에 설정이나 학습 화면에서 언제든 바꿀 수 있어요.',
  ]

  function next() {
    if (step < 2) setStep(step + 1)
    else
      onDone({ nickname: nickname.trim() || '작은 탐험가', look, faceImage, defaultDifficulty: difficulty })
  }

  return (
    <main className="screen onboarding-screen">
      <div className="onboarding-steps" aria-label={`${step + 1} / 3 단계`}>
        {[0, 1, 2].map((index) => (
          <span key={index} className={index <= step ? 'done' : ''} />
        ))}
      </div>
      <header className="onboarding-head">
        <h1>{titles[step]}</h1>
        <p>{subtitles[step]}</p>
      </header>

      <div className="onboarding-preview">
        {SHOW_DETAILED_LOOK ? (
          <Avatar look={look} equipped={step === 0 ? {} : equipped} />
        ) : (
          <CharacterAvatar look={look} equipped={step === 0 ? {} : equipped} label="내 아바타 미리보기" />
        )}
      </div>

      {step === 0 && (
        <section className="onboarding-panel">
          <label className="field">
            <span>닉네임</span>
            <input
              value={nickname}
              maxLength={10}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="작은 탐험가"
            />
          </label>
          <LookFields look={look} onChange={setLook} />
          {SHOW_DETAILED_LOOK && (
            <>
              <OptionRow
                label="체형"
                options={['마름', '보통', '튼튼'] as const}
                value={look.body}
                onChange={(body) => setLook({ ...look, body })}
              />
              <OptionRow
                label="머리"
                options={['짧은 머리', '긴 머리', '상투·쪽머리'] as const}
                value={look.hair}
                onChange={(hair) => setLook({ ...look, hair })}
              />
              <div className="option-row">
                <span>피부색</span>
                <div className="skin-options">
                  {skinTones.map((tone) => (
                    <button
                      type="button"
                      key={tone}
                      className={look.skin === tone ? 'active' : ''}
                      style={{ background: tone }}
                      onClick={() => setLook({ ...look, skin: tone })}
                      aria-label={`피부색 ${tone}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-panel face-panel">
          <FacePhotoField faceImage={faceImage} onChange={setFaceImage} />
        </section>
      )}
      {step === 2 && (
        <section className="onboarding-panel">
          {(['쉬움', '보통', '어려움'] as Difficulty[]).map((item) => (
            <button
              type="button"
              key={item}
              className={`level-card ${difficulty === item ? 'active' : ''}`}
              onClick={() => setDifficulty(item)}
            >
              <strong>{item}</strong>
              <span>
                {item === '쉬움' && '짧은 문장과 쉬운 낱말로 읽어요. 초등학생에게 추천해요.'}
                {item === '보통' && '중요한 연도와 인물을 함께 알아봐요.'}
                {item === '어려움' && '배경과 의미까지 깊이 있게 읽어요.'}
              </span>
            </button>
          ))}
        </section>
      )}

      <div className="onboarding-actions">
        {step > 0 && (
          <ActionButton variant="ghost" onClick={() => setStep(step - 1)}>
            이전
          </ActionButton>
        )}
        <ActionButton onClick={next}>
          {step === 1 && !faceImage ? '건너뛰기' : step === 2 ? '탐험 시작하기' : '다음'}{' '}
          <Icon name="chevron" size={18} />
        </ActionButton>
      </div>
    </main>
  )
}
