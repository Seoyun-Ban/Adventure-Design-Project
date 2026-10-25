import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { SubpageHeader } from '../components/SubpageHeader'
import { findPlace } from '../data/places'
import type { LearningRecord } from '../types'

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

// 학습 아카이브: 실제 학습 기록을 연/월별로 묶어 보여준다
export function ArchiveScreen({ records, onBack }: { records: LearningRecord[]; onBack: () => void }) {
  const dated = useMemo(
    () =>
      records
        .map((record) => ({ ...record, date: new Date(record.learnedAt) }))
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
          <span>역사 장소를 학습하면 여기에 쌓여요.</span>
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
                    <article key={record.placeId}>
                      <span className="record-foot">
                        <Icon name="footprint" size={20} />
                      </span>
                      <div className="record-copy">
                        <small>{place?.region}</small>
                        <strong>{place?.name ?? record.placeId}</strong>
                        <span className="record-badges">
                          <i className="complete">
                            <Icon name="check" size={11} />
                            학습 완료
                          </i>
                          {record.quizAt && (
                            <i className="quiz">
                              <Icon name="quiz" size={11} />
                              퀴즈 완료
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
