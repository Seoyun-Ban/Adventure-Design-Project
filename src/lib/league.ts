// 대결 랭킹(리그): 나와 가상 친구들을 승수 → 승률 순으로 줄 세운다.
// 화면 코드와 분리한 순수 함수라서 scripts/league.test.mjs가 그대로 검사한다.

export type Tally = { wins: number; losses: number }
export type Standing = Tally & { id: string; name: string; level: number; isMe: boolean; rate: number }
export type LeagueFriend = { id: string; name: string; level: number }

/** 승률 (0~1). 한 판도 안 했으면 0 */
export function winRate({ wins, losses }: Tally) {
  const played = wins + losses
  return played ? wins / played : 0
}

/** 순위 정하기: 승수가 많은 순 → 승률 높은 순 → 레벨 높은 순 → 이름 순. 같은 순위 없이 1위부터 차례로 센다 */
export function rankStandings(entries: Omit<Standing, 'rate'>[]): Standing[] {
  return entries
    .map((entry) => ({ ...entry, rate: winRate(entry) }))
    .sort(
      (a, b) => b.wins - a.wins || b.rate - a.rate || b.level - a.level || a.name.localeCompare(b.name, 'ko'),
    )
}

/** 나와 가상 친구들의 순위표 (나의 기록은 대결 기록 played·wins에서 가져온다) */
export function buildStandings(
  me: { name: string; level: number; played: number; wins: number },
  friends: LeagueFriend[],
  league: Record<string, Tally>,
): Standing[] {
  return rankStandings([
    { id: 'me', name: me.name, level: me.level, wins: me.wins, losses: me.played - me.wins, isMe: true },
    ...friends.map((friend) => ({
      ...friend,
      wins: league[friend.id]?.wins ?? 0,
      losses: league[friend.id]?.losses ?? 0,
      isMe: false,
    })),
  ])
}

/** 내 순위 (1위부터) */
export const myRank = (standings: Standing[]) => standings.findIndex((row) => row.isMe) + 1

/** 내가 가상 친구와 대결한 결과를 그 친구의 기록에 더한다 (내가 이기면 친구의 패배, 지면 친구의 승리) */
export function addFriendResult(
  league: Record<string, Tally>,
  friendId: string,
  meWon: boolean,
): Record<string, Tally> {
  const now = league[friendId] ?? { wins: 0, losses: 0 }
  return {
    ...league,
    [friendId]: meWon ? { ...now, losses: now.losses + 1 } : { ...now, wins: now.wins + 1 },
  }
}

/** 순위가 올랐을 때만 알림 글을 돌려준다 */
export function rankUpMessage(before: number, after: number) {
  return after > 0 && after < before ? `랭킹 ${after}위로 올랐어요!` : null
}
