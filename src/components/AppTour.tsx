import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Spotlight, bubblePosition, type Spot } from './Spotlight'
import { CharacterAvatar } from './CharacterAvatar'
import { TOGETHER_MIN_PLACES } from '../data/battle'
import type { AvatarLook, Tab } from '../types'

// 앱 소개 안내 (처음 지도에 들어왔을 때 한 번, 도움말의 '앱 소개 다시 보기'로 언제든)
// 화면을 살짝 어둡게 하고 설명할 곳만 밝게 비춘 뒤, 옆에 내 아바타와 말풍선으로 설명한다.
// 필요하면 아래 탭을 자동으로 옮겨 간다.

type Step = {
  /** 이 단계에서 보여줄 탭 */
  tab: Tab
  /** 밝게 비출 곳들 (없으면 화면 가운데에 말풍선만) */
  spots: Spot[]
  title: string
  body: ReactNode
}

const tabSpot = (tab: Tab): Spot => ({ selector: `.bottom-tabs [data-tab="${tab}"]` })

const STEPS: Step[] = [
  {
    tab: 'map',
    spots: [{ selector: '.official-korea-map' }],
    title: '여기는 역사 지도예요',
    body: '역사 장소에 직접 가면 그 장소의 이야기가 열려요.',
  },
  {
    tab: 'map',
    spots: [
      {
        selector:
          '.map-marker[data-place="gyeongbokgung"], .map-marker[data-place="suwon"], .map-marker[data-place="independence"], .map-marker[data-place="aunae"]',
        all: true,
      },
    ],
    title: '장소 표시를 읽어 볼까요?',
    body: (
      <ul className="tour-legend">
        <li>
          <i className="tour-lock">
            <Icon name="lock" size={11} />
          </i>
          회색 자물쇠: 아직 안 가 본 곳
        </li>
        <li>
          <i className="tour-dot green" /> 초록: 이야기가 열린 곳
        </li>
        <li>
          <i className="tour-foot">
            <Icon name="footprint" size={13} />
          </i>
          발자국: 학습을 마친 곳
        </li>
      </ul>
    ),
  },
  {
    tab: 'map',
    spots: [{ selector: '.map-legend' }],
    title: '지도 아래 버튼',
    body: '발자국과 학습 가능 지역을 켜고 끌 수 있어요. ‘퀴즈’를 누르면 배운 장소의 퀴즈를 풀어요.',
  },
  {
    tab: 'book',
    spots: [{ selector: '.bookshelf' }, tabSpot('book')],
    title: '이야기책',
    body: '모은 이야기를 주제별 책으로 읽어요.',
  },
  {
    tab: 'avatar',
    spots: [{ selector: '.equip-slots, .competition-button', all: true }, tabSpot('avatar')],
    title: '아바타',
    body: `학습하면 역사 아이템을 얻고 입혀 볼 수 있어요. 장소 ${TOGETHER_MIN_PLACES}곳을 학습하면 친구와 함께하는 보스전과 대결도 열려요. 문제는 배운 장소에서만 나와요!`,
  },
  {
    tab: 'profile',
    spots: [{ selector: '.profile-menu' }, { selector: '.profile-settings' }, tabSpot('profile')],
    title: '내 정보',
    body: '배지, 학습 아카이브, 도움말을 볼 수 있어요. 설정은 오른쪽 위 톱니바퀴예요.',
  },
  {
    tab: 'map',
    spots: [],
    title: '준비 완료!',
    body: '이제 가까운 역사 장소를 찾아 떠나볼까요?',
  },
]

export function AppTour({
  look,
  nickname,
  onTab,
  onFinish,
}: {
  look: AvatarLook
  nickname: string
  /** 탭 옮기기 */
  onTab: (tab: Tab) => void
  /** 끝까지 보거나 건너뛰었을 때 */
  onFinish: () => void
}) {
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  // 단계가 바뀌면 그 탭으로 옮긴다
  useEffect(() => {
    onTab(step.tab)
  }, [step.tab, onTab])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFinish()
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(STEPS.length - 1, value + 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

  return (
    <Spotlight spots={step.spots} stepKey={index} label="앱 소개">
      {(view) => {
        // 비춘 곳이 오른쪽 위에 있으면(내 정보의 톱니바퀴) '건너뛰기'를 왼쪽 위로 옮겨 가리지 않게 한다
        const skipOnLeft = view.holes.some(
          (hole) => hole.cx + hole.rx > view.size.width - 130 && hole.cy - hole.ry < 70,
        )
        return (
          <>
            <button type="button" className={`tour-skip ${skipOnLeft ? 'left' : ''}`} onClick={onFinish}>
              건너뛰기
            </button>

            <div className="tour-bubble-wrap" style={bubblePosition(view)} key={index}>
              <div className="tour-guide">
                <CharacterAvatar look={look} label={`${nickname}의 아바타`} />
              </div>
              <section className="tour-bubble">
                <div aria-live="polite">
                  <strong>{step.title}</strong>
                  <div className="tour-body">{step.body}</div>
                </div>
              </section>
              {/* 이전·진행 점·다음: 아바타와 말풍선 아래에 전체 폭으로 (좁은 화면에서도 글자가 한 줄) */}
              <div className="tour-controls">
                <button
                  type="button"
                  className="tour-prev"
                  onClick={() => setIndex(index - 1)}
                  disabled={index === 0}
                >
                  이전
                </button>
                <div className="tour-dots" aria-label={`${STEPS.length}단계 중 ${index + 1}단계`}>
                  {STEPS.map((_, i) => (
                    <i key={i} className={i === index ? 'active' : ''} />
                  ))}
                </div>
                <button
                  type="button"
                  className="tour-next"
                  onClick={() => (last ? onFinish() : setIndex(index + 1))}
                >
                  {last ? '떠나 볼까요!' : '다음'}
                </button>
              </div>
            </div>
          </>
        )
      }}
    </Spotlight>
  )
}
