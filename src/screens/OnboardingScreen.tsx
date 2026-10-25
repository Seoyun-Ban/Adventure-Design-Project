import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { Avatar } from '../components/Avatar'
import { CharacterAvatar } from '../components/CharacterAvatar'
import { skinTones } from '../data/avatar'
import type { AvatarLook, Difficulty, Equipped } from '../types'

// 처음 이용할 때 한 번 거치는 설정 화면
// 1) 닉네임·아바타 외형  2) 얼굴 등록  3) 기본 학습 단계

/**
 * 체형·머리·피부색 선택을 보여줄지.
 * 지금 그림 캐릭터는 성별별 한 종류뿐이라 꺼 둔다 (선택해도 그림에 반영되지 않으므로).
 * 체형·머리 모양별 그림이 생기면 true로 바꾸고, CharacterAvatar가 그 선택을 쓰도록 고치면 된다.
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
  const fileInput = useRef<HTMLInputElement>(null)

  const titles = ['나만의 탐험가 만들기', '얼굴 등록하기', '학습 단계 고르기']
  const subtitles = [
    '역사 여행을 함께할 아바타의 모습을 골라주세요.',
    '찍은 얼굴은 학습 영상 속 역사 현장에 함께 등장해요.',
    '나중에 설정이나 학습 화면에서 언제든 바꿀 수 있어요.',
  ]

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFaceImage(await resizeImage(file, 160))
  }

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
          <CharacterAvatar
            gender={look.gender}
            equipped={step === 0 ? {} : equipped}
            label="내 아바타 미리보기"
          />
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
          <OptionRow
            label="성별"
            options={['남', '여'] as const}
            value={look.gender}
            onChange={(gender) => setLook({ ...look, gender })}
          />
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
          <div className={`face-frame ${faceImage ? 'has-photo' : ''}`}>
            {faceImage ? <img src={faceImage} alt="등록한 얼굴" /> : <Icon name="user" size={46} />}
            <i />
          </div>
          <p className="face-guide">
            정면을 바라보고 얼굴이 원 안에 들어오게 찍어주세요.
            <br />
            사진은 이 기기에만 저장돼요.
          </p>
          <input ref={fileInput} type="file" accept="image/*" capture="user" hidden onChange={handlePhoto} />
          <ActionButton variant="secondary" onClick={() => fileInput.current?.click()}>
            <Icon name="camera" size={18} /> {faceImage ? '다시 찍기' : '촬영하기'}
          </ActionButton>
          {faceImage && (
            <button type="button" className="text-link" onClick={() => setFaceImage(undefined)}>
              사진 지우기
            </button>
          )}
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

function OptionRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="option-row">
      <span>{label}</span>
      <div className="settings-segments">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={value === option ? 'active' : ''}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 사진을 정사각형으로 잘라 작게 줄이고, 2D 캐릭터와 어울리도록 만화풍으로 바꾼다.
 * (색 단순화 + 부드럽게 + 윤곽선) — 사진은 서버로 보내지 않고 기기 안에서만 처리한다.
 */
function resizeImage(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const image = new Image()
      image.onerror = reject
      image.onload = () => {
        const side = Math.min(image.width, image.height)
        // 1) 작게 줄였다가 키워서 잔주름·잡티를 부드럽게
        const small = document.createElement('canvas')
        small.width = small.height = 56
        small
          .getContext('2d')
          ?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 56, 56)
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('canvas unavailable'))
        context.imageSmoothingQuality = 'high'
        context.drawImage(small, 0, 0, size, size)
        // 2) 색을 몇 단계로 단순화 (만화 채색 느낌)
        const data = context.getImageData(0, 0, size, size)
        const px = data.data
        const levels = 6
        const lum = new Float32Array(size * size)
        for (let i = 0; i < px.length; i += 4) {
          for (let c = 0; c < 3; c += 1) {
            const boosted = Math.min(255, px[i + c] * 1.06 + 6)
            px[i + c] = Math.round(Math.round((boosted / 255) * (levels - 1)) * (255 / (levels - 1)))
          }
          lum[i / 4] = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
        }
        // 3) 밝기 차이가 큰 곳에 윤곽선
        for (let y = 1; y < size - 1; y += 1) {
          for (let x = 1; x < size - 1; x += 1) {
            const k = y * size + x
            const gx = lum[k + 1] - lum[k - 1]
            const gy = lum[k + size] - lum[k - size]
            if (Math.hypot(gx, gy) > 70) {
              px[k * 4] *= 0.45
              px[k * 4 + 1] *= 0.4
              px[k * 4 + 2] *= 0.4
            }
          }
        }
        context.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
