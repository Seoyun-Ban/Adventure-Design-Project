import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { HistoryScene } from '../components/HistoryScene'
import { Place3D } from '../components/Place3D'
import { PlaceItems } from '../components/PlaceItems'
import { getContent } from '../data/contents'
import type { AvatarLook, Difficulty, Equipped, Place } from '../types'

// 역사 학습 화면: 장소별 콘텐츠를 data/contents.ts에서 불러온다
export function LearnScreen({
  place,
  defaultDifficulty,
  avatar,
  favorite,
  completed,
  onToggleFavorite,
  onBack,
  onComplete,
  onQuiz,
}: {
  place: Place
  defaultDifficulty: Difficulty
  avatar: { nickname: string; look: AvatarLook; equipped: Equipped; faceImage?: string }
  favorite: boolean
  /** 이미 학습을 마친 장소인지 (얻는 아이템을 '획득 완료'로 표시) */
  completed: boolean
  onToggleFavorite: () => void
  onBack: () => void
  onComplete: (difficulty: Difficulty) => void
  /** 퀴즈 난이도는 지금 읽고 있는 학습 단계와 같다 */
  onQuiz: (difficulty: Difficulty) => void
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty)
  const content = getContent(place.id)
  const text = content.body[difficulty]

  return (
    <main className="screen learn-screen">
      <div className="learn-hero">
        {content.heroImage ? (
          <img src={content.heroImage} alt={content.heroAlt} />
        ) : (
          <Place3D placeId={place.id} className="hero-3d" />
        )}
        <div className="hero-shade" />
        <button className="icon-button hero-back" onClick={onBack} type="button" aria-label="뒤로 가기">
          <Icon name="arrow" />
        </button>
        <div className="hero-label">
          <span>{content.tagline}</span>
          <h1>{place.name}</h1>
        </div>
        <button
          type="button"
          className={`icon-button hero-favorite ${favorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          aria-label={favorite ? '관심 장소에서 빼기' : '관심 장소로 추가'}
        >
          <Icon name="heart" size={20} />
        </button>
        <div className="hero-count">
          <Icon name="book" size={15} /> {content.readMinutes}분
        </div>
      </div>
      <article className="learn-article">
        <PlaceItems placeId={place.id} owned={completed} className="learn-items" />
        <div className="difficulty-row">
          <div>
            <span>학습 단계</span>
            <small>나에게 맞게 읽어보세요</small>
          </div>
          <div className="segment-control">
            {(['쉬움', '보통', '어려움'] as Difficulty[]).map((item) => (
              <button
                type="button"
                key={item}
                className={difficulty === item ? 'active' : ''}
                onClick={() => setDifficulty(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="chapter-kicker">
          <span>첫 번째 이야기</span>
          <i />
        </div>
        <h2 style={{ whiteSpace: 'pre-line' }}>{content.headline}</h2>
        <p className="lead">{text.intro}</p>
        <div className="history-note">
          <span>알고 있었나요?</span>
          <p>{content.didYouKnow}</p>
        </div>
        <HistoryScene placeId={place.id} placeName={place.name} {...avatar} />
        {content.detailImage && (
          <figure>
            <img src={content.detailImage} alt={content.detailCaption} />
            <figcaption>{content.detailCaption}</figcaption>
          </figure>
        )}
        <h3>{content.sectionTitle}</h3>
        {text.detail.split('\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="mini-quiz">
          <Icon name="sparkle" size={22} />
          <div>
            <strong>잠깐, 기억해 볼까요?</strong>
            <span>{content.remember}</span>
          </div>
        </div>
      </article>
      <div className="learn-actions">
        <ActionButton variant="secondary" onClick={() => onComplete(difficulty)}>
          <Icon name="footprint" size={20} /> 학습 완료
        </ActionButton>
        <ActionButton onClick={() => onQuiz(difficulty)}>
          퀴즈 풀어보기 <Icon name="chevron" size={19} />
        </ActionButton>
      </div>
    </main>
  )
}
