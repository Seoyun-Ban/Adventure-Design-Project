import { Icon } from '../components/Icon'
import { SubpageHeader } from '../components/SubpageHeader'
import { places } from '../data/places'
import type { Place } from '../types'

// 지도의 '퀴즈' 버튼으로 여는 화면: 학습한 장소 중에서 퀴즈를 골라 푼다.
// 이미 완료한 퀴즈도 새 문제로 다시 풀 수 있다.
export function QuizHubScreen({
  completedIds,
  quizDoneIds,
  onBack,
  onStart,
}: {
  completedIds: string[]
  quizDoneIds: string[]
  onBack: () => void
  onStart: (place: Place) => void
}) {
  const list = places.filter((place) => completedIds.includes(place.id))
  return (
    <section className="utility-screen archive-screen">
      <SubpageHeader title="퀴즈" subtitle="학습한 장소를 골라 문제에 도전해요" onBack={onBack} />
      {list.length === 0 ? (
        <div className="book-empty">
          <Icon name="quiz" size={30} />
          <strong>도전할 퀴즈가 없어요</strong>
          <span>역사 장소를 학습하면 퀴즈가 열려요.</span>
        </div>
      ) : (
        <div className="archive-records quiz-hub-list">
          {list.map((place) => {
            const done = quizDoneIds.includes(place.id)
            return (
              <button type="button" key={place.id} onClick={() => onStart(place)}>
                <span className="record-foot">
                  <Icon name={done ? 'check' : 'quiz'} size={20} />
                </span>
                <span className="record-copy">
                  <small>{place.region}</small>
                  <strong>{place.name}</strong>
                  <span className={`quiz-state ${done ? 'done' : ''}`}>
                    {done ? '퀴즈 완료 · 새 문제로 다시 풀기' : '아직 풀지 않은 퀴즈'}
                  </span>
                </span>
                <Icon name="chevron" size={18} />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
