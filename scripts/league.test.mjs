// 대결 랭킹 순서와 승패 반영을 검사한다 (실행: npm test)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addFriendResult,
  buildStandings,
  myRank,
  playFriendMatch,
  rankStandings,
  rankUpMessage,
  winChance,
  winRate,
} from '../src/lib/league.ts'

const friends = [
  { id: 'a', name: '가', level: 4 },
  { id: 'b', name: '나', level: 5 },
  { id: 'c', name: '다', level: 3 },
]
const me = (played, wins, level = 2) => ({ name: '나는', level, played, wins })
const names = (rows) => rows.map((row) => row.name)

test('승수가 많은 순으로 줄 세운다', () => {
  const rows = buildStandings(me(0, 0), friends, {
    a: { wins: 4, losses: 3 },
    b: { wins: 5, losses: 2 },
    c: { wins: 2, losses: 4 },
  })
  assert.deepEqual(names(rows), ['나', '가', '다', '나는'])
})

test('승수가 같으면 승률이 높은 쪽이 앞선다', () => {
  const rows = buildStandings(me(0, 0), friends, {
    a: { wins: 4, losses: 6 }, // 40%
    b: { wins: 4, losses: 1 }, // 80%
    c: { wins: 4, losses: 4 }, // 50%
  })
  assert.deepEqual(names(rows).slice(0, 3), ['나', '다', '가'])
})

test('승수·승률이 같으면 레벨이 높은 쪽이 앞선다', () => {
  const rows = rankStandings([
    { id: 'a', name: '가', level: 3, wins: 2, losses: 2, isMe: false },
    { id: 'b', name: '나', level: 6, wins: 2, losses: 2, isMe: false },
  ])
  assert.deepEqual(names(rows), ['나', '가'])
})

test('한 판도 안 했으면 승률은 0이고 나눗셈 오류가 없다', () => {
  assert.equal(winRate({ wins: 0, losses: 0 }), 0)
  assert.equal(winRate({ wins: 3, losses: 1 }), 0.75)
})

test('내 기록은 판수·승수에서 패배 수를 계산하고 내 순위를 찾는다', () => {
  const rows = buildStandings(me(10, 6), friends, {
    a: { wins: 4, losses: 3 },
    b: { wins: 5, losses: 2 },
    c: { wins: 2, losses: 4 },
  })
  assert.equal(myRank(rows), 1)
  assert.equal(rows[0].losses, 4)
  assert.equal(rows[0].isMe, true)
})

test('친구와 대결하면 그 친구 기록이 반대로 바뀌고 원본은 그대로다', () => {
  const league = { a: { wins: 4, losses: 3 } }
  const iWon = addFriendResult(league, 'a', true)
  assert.deepEqual(iWon.a, { wins: 4, losses: 4 })
  const iLost = addFriendResult(league, 'a', false)
  assert.deepEqual(iLost.a, { wins: 5, losses: 3 })
  assert.deepEqual(league.a, { wins: 4, losses: 3 })
  assert.deepEqual(addFriendResult({}, 'z', true).z, { wins: 0, losses: 1 })
})

test('순위가 올랐을 때만 알림 글이 나온다', () => {
  assert.equal(rankUpMessage(4, 3), '랭킹 3위로 올랐어요!')
  assert.equal(rankUpMessage(2, 1), '랭킹 1위로 올랐어요!')
  assert.equal(rankUpMessage(3, 3), null)
  assert.equal(rankUpMessage(2, 3), null)
})

// random 값을 차례로 돌려주는 가짜 난수 (첫 값: 첫 친구, 둘째 값: 둘째 친구, 셋째 값: 승부)
const fakeRandom = (...values) => () => values.shift()

test('레벨이 높을수록 이길 확률이 조금 높고, 한계가 있다', () => {
  assert.equal(winChance(4, 4), 0.5)
  assert.ok(winChance(5, 3) > 0.5 && winChance(3, 5) < 0.5)
  assert.ok(Math.abs(winChance(5, 3) + winChance(3, 5) - 1) < 1e-9)
  assert.equal(winChance(30, 1), 0.65)
  assert.equal(winChance(1, 30), 0.35)
})

test('가상 친구 한 판: 두 친구에게 승 하나·패 하나가 더해지고 원본은 그대로다', () => {
  const league = { a: { wins: 1, losses: 1 }, b: { wins: 2, losses: 2 }, c: { wins: 3, losses: 3 } }
  // 첫 친구 a(0), 둘째 친구는 남은 b·c 중 b(0), 승부 0.1 < 확률 → a 승
  const after = playFriendMatch(league, friends, fakeRandom(0, 0, 0.1))
  assert.deepEqual(after.a, { wins: 2, losses: 1 })
  assert.deepEqual(after.b, { wins: 2, losses: 3 })
  assert.deepEqual(after.c, league.c)
  assert.deepEqual(league.a, { wins: 1, losses: 1 })
  // 승부 값이 크면(0.99) 반대로 b 승
  const flipped = playFriendMatch(league, friends, fakeRandom(0, 0, 0.99))
  assert.deepEqual(flipped.a, { wins: 1, losses: 2 })
  assert.deepEqual(flipped.b, { wins: 3, losses: 2 })
})

test('가상 친구 한 판: 같은 친구끼리 붙지 않고, 많이 해도 승·패 합이 같다', () => {
  let league = {}
  for (let i = 0; i < 500; i++) league = playFriendMatch(league, friends)
  const rows = Object.values(league)
  assert.equal(rows.reduce((sum, r) => sum + r.wins, 0), 500)
  assert.equal(rows.reduce((sum, r) => sum + r.losses, 0), 500)
  // 레벨이 가장 높은 b(5)가 가장 낮은 c(3)보다 승률이 높다 (500판이면 거의 확실)
  assert.ok(winRate(league.b) > winRate(league.c))
})
