import { battleFriends, levelFor } from '../data/avatar'
import { withFriendLevels } from '../lib/battleBalance'
import { buildStandings, type Tally } from '../lib/league'
import type { BattleRecord } from '../hooks/useProgress'

// 대결 랭킹 순위표: 나와 가상 친구들을 승수 → 승률 순으로 보여준다 (내 줄은 강조)
export function LeagueTable({
  nickname,
  xp,
  battle,
  league,
}: {
  nickname: string
  xp: number
  battle: BattleRecord
  league: Record<string, Tally>
}) {
  const rows = buildStandings(
    { name: nickname, level: levelFor(xp), played: battle.played, wins: battle.wins },
    withFriendLevels(battleFriends, levelFor(xp)),
    league,
  )
  return (
    <section className="league" aria-label="대결 랭킹">
      <p className="league-note">
        나와 친구들의 대결 순위예요. 이긴 횟수가 많을수록 높고, 같으면 승률이 높은 쪽이 앞서요.
      </p>
      <ol className="league-list">
        {rows.map((row, index) => (
          <li key={row.id} className={row.isMe ? 'me' : ''} aria-current={row.isMe ? 'true' : undefined}>
            <span className="league-rank">{index + 1}</span>
            <span className="league-name">
              <strong>{row.isMe ? `${row.name} (나)` : row.name}</strong>
              <small>Lv. {row.level}</small>
            </span>
            <span className="league-record">
              <strong>
                {row.wins}승 {row.losses}패
              </strong>
              <small>승률 {row.wins + row.losses ? `${Math.round(row.rate * 100)}%` : '-'}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
