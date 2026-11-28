import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { SubpageHeader } from '../components/SubpageHeader'
import { findPlace } from '../data/places'
import type { ArchiveEntry } from '../types'

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

type Filter = 'all' | 'learn' | 'quiz'
const FILTERS: [Filter, string][] = [
  ['all', '전체'],
  ['learn', '학습 완료'],
  ['quiz', '퀴즈 완료'],
]

// 학습 아카이브: 학습을 마치거나 퀴즈를 통과할 때마다 쌓인 기록을 연/월별로 묶어 보여준다 (같은 장소도 매번 한 줄씩)
export function ArchiveScreen({ history, onBack }: { history: ArchiveEntry[]; onBack: () => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const records = useMemo(
    () => (filter === 'all' ? history : history.filter((entry) => entry.kind === filter)),
    [history, filter],
  )
  const dated = useMemo(
    () =>
      records
        .map((record) => ({ ...record, date: new Date(record.at) }))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [records],
  )
  const latest = dated[0]?.date ?? new Date()
  const [year, setYear] = useState(latest.getFullYear())
  const [month, setMonth] = useState(latest.getMonth() + 1)

  const years = Array.from(
    new Set([new Date().getFullYear(), ...dated.map((record) => record.date.getFullYear())]),
  ).sort((a, b) => b - a)
  const inMonth = dated.filter(
    (record) => record.date.getFullYear() === year && record.date.getMonth() + 1 === month,
  )

  const groups = inMonth.reduce<{ key: string; date: Date; items: typeof inMonth }[]>((list, record) => {
    const key = record.date.toDateString()
    const group = list.find((item) => item.key === key)
    if (group) group.items.push(record)
    else list.push({ key, date: record.date, items: [record] })
    return list
  }, [])

  return (
    <section className="utility-screen archive-screen">
      <SubpageHeader title="학습 아카이브" subtitle="걸음마다 쌓인 역사 기록" onBack={onBack} />
      <div
        className="competition-tabs archive-filter"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
        role="tablist"
        aria-label="기록 분류"
      >
        {FILTERS.map(([key, label]) => (
          <button
            type="button"
            role="tab"
            key={key}
            aria-selected={filter === key}
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="archive-period">
        <div>
          <label>
            <span>연도</span>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>월</span>
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => 12 - index).map((item) => (
                <option key={item} value={item}>
                  {item}월
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="archive-total">
          <strong>{inMonth.length}</strong>개의 기록
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="book-empty">
          <Icon name="archive" size={30} />
          <strong>이 달의 기록이 없어요</strong>
          <span>{filter === 'quiz' ? '퀴즈를 통과하면' : '역사 장소를 학습하면'} 여기에 쌓여요.</span>
        </div>
      ) : (
        <div className="archive-timeline">
          {groups.map((group) => (
            <section key={group.key} className="archive-day">
              <div className="archive-date">
                <span />
                <div>
                  <strong>
                    {group.date.getFullYear()}년 {group.date.getMonth() + 1}월 {group.date.getDate()}일
                  </strong>
                  <small>
                    {group.date.toDateString() === new Date().toDateString()
                      ? '오늘'
                      : WEEKDAYS[group.date.getDay()]}
                  </small>
                </div>
              </div>
              <div className="archive-records">
                {group.items.map((record) => {
                  const place = findPlace(record.placeId)
                  return (
                    <article key={record.id}>
                      <span className="record-foot">
                        <Icon name="footprint" size={20} />
                      </span>
                      <div className="record-copy">
                        <small>{place?.region}</small>
                        <strong>{place?.name ?? record.placeId}</strong>
                        <span className="record-badges">
                          {record.kind === 'learn' ? (
                            <i className="complete">
                              <Icon name="check" size={11} />
                              학습 완료
                            </i>
                          ) : (
                            <i className="quiz">
                              <Icon name="quiz" size={11} />
                              퀴즈 완료
                            </i>
                          )}
                          {record.difficulty && (
                            <i className="level">
                              {record.kind === 'learn' ? '학습' : '퀴즈'} {record.difficulty}
                            </i>
                          )}
                          {record.kind === 'quiz' &&
                            record.score !== undefined &&
                            record.total !== undefined && (
                              <i className="score">
                                {record.score}/{record.total} 정답
                              </i>
                            )}
                        </span>
                      </div>
                      <Icon name="chevron" size={18} />
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
