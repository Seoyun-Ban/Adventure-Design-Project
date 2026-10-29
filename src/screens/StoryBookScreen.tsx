import { useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { places } from '../data/places'
import { storyBooks, isChapterUnlocked, isBookDiscovered, readCount } from '../data/storyBooks'
import type { Place, StoryBookData, StoryChapter } from '../types'

// 이야기책 탭: 주제마다 책 한 권으로 꽂힌 책장
export function StoryBookScreen({
  completedIds,
  visitedIds,
  onLearn,
}: {
  completedIds: string[]
  /** 방문해서 열린 장소 id */
  visitedIds: string[]
  onLearn: (place: Place) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState<StoryBookData | null>(null)
  const discovered = storyBooks.filter((book) => isBookDiscovered(book, visitedIds))
  /** 책장에 꽂아 둘 ? 책 수(최대 3권)와, 그 밖에 더 숨겨진 책 수 */
  const unknownCount = storyBooks.length - discovered.length
  const unknownShown = Math.min(3, unknownCount)
  const unknownMore = unknownCount - unknownShown
  const keyword = query.trim().toLowerCase()
  const visibleBooks = discovered.filter(
    (book) =>
      !keyword ||
      [book.title, book.subtitle, ...book.tags, ...book.chapters.map((chapter) => chapter.title)].some(
        (value) => value.toLowerCase().includes(keyword),
      ),
  )

  /** 챕터와 연결된 지도 장소 (지도에 없는 장소면 undefined) */
  const placeOf = (chapter: StoryChapter) =>
    chapter.placeId ? places.find((item) => item.id === chapter.placeId) : undefined

  function openChapter(chapter: StoryChapter) {
    if (!isChapterUnlocked(chapter, visitedIds) || !chapter.placeId) return
    const place = places.find((item) => item.id === chapter.placeId)
    if (place) onLearn(place)
  }

  if (selectedBook) {
    const read = readCount(selectedBook, completedIds)
    const total = selectedBook.chapters.length
    // 이 책의 이야기를 열 수 있는 지도 장소 (겹치지 않게, 차례 순서대로)
    const bookPlaces = [
      ...new Set(selectedBook.chapters.map((chapter) => placeOf(chapter)?.name).filter(Boolean)),
    ]
    return (
      <section className="content-screen tab-screen story-detail-screen">
        <header className="story-detail-top">
          <button
            type="button"
            className="icon-button plain"
            onClick={() => setSelectedBook(null)}
            aria-label="책장으로 돌아가기"
          >
            <Icon name="arrow" />
          </button>
          <span>이야기책</span>
          <span />
        </header>
        {bookPlaces.length > 0 && (
          <p className="book-places">
            <Icon name="map" size={13} /> 열 수 있는 곳: {bookPlaces.join(', ')}
          </p>
        )}
        <div className="story-detail-cover">
          <BookCover book={selectedBook} large />
          <div>
            <small>{selectedBook.tags.slice(0, 3).join(' · ')}</small>
            <h2>{selectedBook.title}</h2>
            <p>{selectedBook.subtitle}</p>
          </div>
        </div>
        <div className="book-detail-progress">
          <div>
            <strong>{read}개의 이야기를 읽었어요</strong>
            <span>{Math.round((read / total) * 100)}%</span>
          </div>
          <div className="book-progress-track">
            <i style={{ width: `${(read / total) * 100}%` }} />
          </div>
        </div>
        <div className="chapter-heading">
          <div>
            <p className="eyebrow">차례</p>
            <h3>이야기 목록</h3>
          </div>
          <span>
            {read} / {total} 읽음
          </span>
        </div>
        <div className="book-chapter-list">
          {selectedBook.chapters.map((chapter, index) => {
            const unlocked = isChapterUnlocked(chapter, visitedIds)
            const done = Boolean(chapter.placeId && completedIds.includes(chapter.placeId))
            const place = placeOf(chapter)
            return (
              <button
                type="button"
                key={`${selectedBook.id}-${index}`}
                className={unlocked ? 'unlocked' : 'locked'}
                onClick={() => openChapter(chapter)}
                disabled={!unlocked}
              >
                <span className="chapter-index">
                  {!unlocked ? (
                    <Icon name="lock" size={17} />
                  ) : done ? (
                    <Icon name="check" size={17} />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                <span className="chapter-info">
                  <small>{unlocked ? chapter.location : `제 ${index + 1}장`}</small>
                  <strong>{unlocked ? chapter.title : '아직 발견하지 않은 이야기'}</strong>
                  <span>
                    {!unlocked
                      ? place
                        ? `${place.name}에 가면 열려요`
                        : '새로운 이야기가 곧 찾아와요'
                      : done
                        ? '다 읽은 이야기'
                        : '이야기 읽기'}
                  </span>
                </span>
                {unlocked && <Icon name="chevron" size={19} />}
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="content-screen tab-screen story-library-screen">
      <header className="content-header story-library-header">
        <div>
          <p className="eyebrow">나의 역사 책장</p>
          <h2>이야기책</h2>
          <p>발걸음으로 모은 이야기를 주제별로 읽어보세요.</p>
        </div>
        <div
          className="library-count"
          aria-label={`전체 ${storyBooks.length}권 중 ${discovered.length}권 발견`}
        >
          <span>
            <strong>{discovered.length}</strong> / {storyBooks.length}권
          </span>
          <i>
            <em style={{ width: `${(discovered.length / storyBooks.length) * 100}%` }} />
          </i>
        </div>
      </header>
      <label className="story-search">
        <Icon name="search" size={19} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="시대, 인물, 장소로 검색"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기">
            <Icon name="close" size={15} />
          </button>
        )}
      </label>
      <div className="bookshelf">
        {visibleBooks.map((book) => {
          const read = readCount(book, completedIds)
          return (
            <button type="button" key={book.id} className="shelf-book" onClick={() => setSelectedBook(book)}>
              <BookCover book={book} />
              <strong>{book.title}</strong>
              <span className="shelf-progress">
                <i>
                  <em style={{ width: `${(read / book.chapters.length) * 100}%` }} />
                </i>
                {read}/{book.chapters.length}
              </span>
            </button>
          )
        })}
        {!keyword &&
          Array.from({ length: unknownShown }, (_, index) => (
            <div key={index} className="shelf-book unknown" aria-hidden="true">
              <span className="book3d">
                <span className="book-face">?</span>
              </span>
              <strong>발견하지 않은 책</strong>
              {/* ? 책은 3권까지만 꽂고, 나머지 숨겨진 책 수는 마지막 ? 책에 표시한다 */}
              {index === unknownShown - 1 && unknownMore > 0 && (
                <span className="shelf-more">+{unknownMore}권 더</span>
              )}
            </div>
          ))}
      </div>
      {visibleBooks.length === 0 && (
        <div className="book-empty">
          <Icon name="search" size={30} />
          <strong>검색 결과가 없어요</strong>
          <span>다른 키워드로 찾아보세요.</span>
        </div>
      )}
    </section>
  )
}

/** 책 모양 표지 (등 + 앞표지 + 종이 단면) */
function BookCover({ book, large = false }: { book: StoryBookData; large?: boolean }) {
  return (
    <span className={`book3d ${large ? 'large' : ''}`} style={{ '--cover': book.cover } as CSSProperties}>
      <span className="book-face">
        <i className="book-band" />
        <b>{book.emblem}</b>
        <small>{book.title}</small>
      </span>
    </span>
  )
}
