import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { SubpageHeader } from '../components/SubpageHeader'
import { findPlace, places } from '../data/places'
import type { WrongAnswer } from '../hooks/useProgress'
import type { Place } from '../types'

// 메뉴의 '퀴즈'와 '복습 퀴즈'
// - new: 학습했지만 아직 퀴즈를 완료하지 않은 장소 고르기
// - review: 틀린 문제를 중심으로 자동으로 다시 출제
export function QuizHubScreen({
  mode,
  completedIds,
  quizDoneIds,
  wrongAnswers,
  onBack,
  onStart,
  onStartReview,
}: {
  mode: 'new' | 'review'
  completedIds: string[]
  quizDoneIds: string[]
  wrongAnswers: WrongAnswer[]
  onBack: () => void
  onStart: (place: Place) => void
  onStartReview: () => void
}) {
  if (mode === 'review') {
    const byPlace = wrongAnswers.reduce<Record<string, number>>((map, wrong) => {
      map[wrong.placeId] = (map[wrong.placeId] ?? 0) + 1
      return map
    }, {})
    return (
      <section className="utility-screen archive-screen">
        <SubpageHeader title="복습 퀴즈" subtitle="틀린 문제부터 다시 풀어요" onBack={onBack} />
        <div className="review-summary">
          <div>
            <strong>{wrongAnswers.length}</strong>
            <span>다시 볼 문제</span>
          </div>
          <p>
            {wrongAnswers.length > 0
              ? '틀렸던 문제를 먼저 내고, 모자라면 학습한 장소에서 새 문제를 섞어요. 맞히면 목록에서 빠져요.'
              : '틀린 문제가 없어요! 학습한 장소에서 새 문제로 복습해요.'}
          </p>
          <ActionButton onClick={onStartReview} disabled={completedIds.length === 0}>
            복습 시작하기 <Icon name="chevron" size={18} />
          </ActionButton>
        </div>
        {Object.keys(byPlace).length > 0 && (
          <div className="archive-records quiz-hub-list">
            {Object.entries(byPlace).map(([placeId, count]) => (
              <article key={placeId}>
                <span className="record-foot">
                  <Icon name="refresh" size={20} />
                </span>
                <span className="record-copy">
                  <small>{findPlace(placeId)?.region}</small>
                  <strong>{findPlace(placeId)?.name}</strong>
                </span>
                <span className="wrong-count">{count}문제</span>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  const list = places.filter((place) => completedIds.includes(place.id) && !quizDoneIds.includes(place.id))
  return (
    <section className="utility-screen archive-screen">
      <SubpageHeader title="퀴즈" subtitle="학습한 내용으로 새로운 문제에 도전해요" onBack={onBack} />
      {list.length === 0 ? (
        <div className="book-empty">
          <Icon name="quiz" size={30} />
          <strong>도전할 퀴즈가 없어요</strong>
          <span>역사 장소를 학습하면 퀴즈가 열려요.</span>
        </div>
      ) : (
        <div className="archive-records quiz-hub-list">
          {list.map((place) => (
            <button type="button" key={place.id} onClick={() => onStart(place)}>
              <span className="record-foot">
                <Icon name="quiz" size={20} />
              </span>
              <span className="record-copy">
                <small>{place.region}</small>
                <strong>{place.name}</strong>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
