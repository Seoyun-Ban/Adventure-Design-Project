import type { BattleRecord } from '../hooks/useProgress'

/** 최근 대결을 몇 개까지 보여줄지 */
const SHOW_RECENT = 5

const formatDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 대결 기록: 승리·패배 수, 승률, 최근 대결 목록 (아바타 탭 경쟁 화면, 내 정보)
export function BattleRecordCard({ battle }: { battle: BattleRecord }) {
  const losses = battle.played - battle.wins
  const rate = battle.played ? Math.round((battle.wins / battle.played) * 100) : 0
  const recent = battle.recent.slice(0, SHOW_RECENT)
  return (
    <section className="battle-record" aria-label="대결 기록">
      <div className="battle-record-stats">
        <div>
          <strong>{battle.wins}</strong>
          <span>승리</span>
        </div>
        <div>
          <strong>{losses}</strong>
          <span>패배</span>
        </div>
        <div>
          <strong>{battle.played ? `${rate}%` : '-'}</strong>
          <span>승률</span>
        </div>
      </div>
      {recent.length > 0 ? (
        <ul className="battle-record-list">
          {recent.map((result, index) => (
            <li key={`${result.at}-${index}`}>
              <span className={`result ${result.won ? 'win' : 'lose'}`}>{result.won ? '승' : '패'}</span>
              <span className="opponent">{result.opponent}</span>
              <time dateTime={result.at}>{formatDate(result.at)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="battle-record-empty">아직 대결 기록이 없어요. 친구에게 도전해 보세요!</p>
      )}
    </section>
  )
}
