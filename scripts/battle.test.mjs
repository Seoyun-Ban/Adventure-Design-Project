// 가상 친구 대결 밸런스 검사 (실행: npm test)
// 시드 난수를 써서 몇 번을 돌려도 같은 결과가 나온다. 숫자는 src/data/battle.ts에서 가져온다.
// 목표 승률: 보통 학생 50~70%, 초보 35~55%, 잘하는 학생 85% 이하 (내 레벨 2·5·10, 친구 셋 모두)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BATTLE_RANGES, BATTLE_RULES, FRIEND_BALANCE } from '../src/data/battle.ts'
import {
  attackRange,
  friendLevel,
  friendTurn,
  rollDefend,
  rollMyAttack,
  scaleFriend,
  seededRandom,
} from '../src/lib/battleBalance.ts'

const GAMES = 3000
const FRIENDS = Object.keys(FRIEND_BALANCE.friends)
// 내 레벨 → 입은 아이템 능력치 합 (레벨 2: 아이템 1개, 5: 2개, 10: 3개 정도)
const ITEM_POWER = { 2: 140, 5: 350, 10: 520 }
const LEVELS = [2, 5, 10]

// 플레이어 종류: 난이도별 정답률, 고르는 난이도, 체력이 이 값보다 낮으면 방어
const PLAYERS = {
  초보: { accuracy: { 쉬움: 0.85, 보통: 0.65, 어려움: 0.45 }, pick: '보통', defendBelow: 30, range: [35, 55] },
  '보통 학생': { accuracy: { 쉬움: 0.9, 보통: 0.75, 어려움: 0.55 }, pick: '보통', defendBelow: 40, range: [50, 70] },
  '잘하는 학생': { accuracy: { 쉬움: 0.95, 보통: 0.85, 어려움: 0.7 }, pick: '어려움', defendBelow: 40, range: [0, 85] },
}

/** 내가 이기면 true */
function playOne(player, level, friendId, random) {
  const power = level * 60 + ITEM_POWER[level]
  const friend = scaleFriend(friendId, level, power)
  let myHp = BATTLE_RULES.hp
  let friendHp = friend.maxHp
  let friendBlock = 0
  for (let turn = 0; turn < 100; turn++) {
    let myBlock = 0
    if (random() < player.accuracy[player.pick]) {
      if (myHp < player.defendBelow) {
        const defend = rollDefend(player.pick, random)
        myHp = Math.min(BATTLE_RULES.hp, myHp + defend.heal)
        myBlock = defend.block
      } else {
        friendHp -= Math.round(rollMyAttack(power, player.pick, random) * (1 - friendBlock))
        if (friendHp <= 0) return true
      }
    }
    friendBlock = 0
    const action = friendTurn(friend, friendHp, myBlock, random)
    if (action.kind === 'attack') {
      myHp -= action.damage
      if (myHp <= 0) return false
    } else if (action.kind === 'defend') {
      friendHp = Math.min(friend.maxHp, friendHp + action.heal)
      friendBlock = action.block
    }
  }
  return false
}

function winPercent(player, level, friendId, seed) {
  const random = seededRandom(seed)
  let wins = 0
  for (let i = 0; i < GAMES; i++) if (playOne(player, level, friendId, random)) wins++
  return (wins / GAMES) * 100
}

test('가상 친구 승률이 목표 범위 안에 있다 (시드 고정)', () => {
  const rows = []
  const failures = []
  let seed = 1
  for (const [name, player] of Object.entries(PLAYERS)) {
    for (const level of LEVELS) {
      const rates = FRIENDS.map((friendId) => winPercent(player, level, friendId, seed++))
      rows.push(`${name.padEnd(8)} Lv${String(level).padEnd(3)} ${rates.map((r, i) => `${FRIENDS[i]} ${r.toFixed(1)}%`).join(' / ')}`)
      rates.forEach((rate, index) => {
        const [low, high] = player.range
        if (rate < low || rate > high) failures.push(`${name} Lv${level} ${FRIENDS[index]}: ${rate.toFixed(1)}% (목표 ${low}~${high}%)`)
      })
    }
  }
  console.log(rows.join('\n'))
  assert.deepEqual(failures, [])
})

test('같은 시드면 승률이 매번 같다', () => {
  const player = PLAYERS['보통 학생']
  assert.equal(winPercent(player, 5, 'minjun', 99), winPercent(player, 5, 'minjun', 99))
})

test('가상 친구는 내 전투력이 높을수록 체력이 늘고 한계 안에 있다', () => {
  for (const id of FRIENDS) {
    let before = 0
    for (const power of [200, 500, 800, 1200, 2000, 5000]) {
      const { maxHp } = scaleFriend(id, 5, power)
      assert.ok(maxHp >= before, `${id} 체력이 줄었어요`)
      assert.ok(maxHp >= FRIEND_BALANCE.hpMin && maxHp <= FRIEND_BALANCE.hpMax)
      before = maxHp
    }
  }
})

test('친구 레벨은 내 레벨을 따라가고 1 아래로 내려가지 않는다', () => {
  assert.equal(friendLevel('seoyeon', 5), 6)
  assert.equal(friendLevel('minjun', 5), 5)
  assert.equal(friendLevel('jiho', 5), 4)
  assert.equal(friendLevel('jiho', 1), 1)
})

test('난이도별 피해·회복·막기 구간이 겹치지 않고 어려울수록 세다', () => {
  const order = ['쉬움', '보통', '어려움']
  for (const key of ['attack', 'heal', 'block']) {
    for (let i = 0; i < 2; i++) {
      const [, easyMax] = BATTLE_RANGES[order[i]][key]
      const [hardMin] = BATTLE_RANGES[order[i + 1]][key]
      assert.ok(hardMin > easyMax, `${key}: ${order[i + 1]} 최소 ${hardMin}가 ${order[i]} 최대 ${easyMax}보다 커야 해요`)
    }
  }
})

test('실제로 굴린 공격 피해도 어려움 최소값이 쉬움 최대값보다 크다 (여러 전투력)', () => {
  for (const power of [120, 260, 650, 1120, 2000, 4000]) {
    const random = seededRandom(power)
    const seen = { 쉬움: [Infinity, 0], 보통: [Infinity, 0], 어려움: [Infinity, 0] }
    for (let i = 0; i < 4000; i++) {
      for (const level of Object.keys(seen)) {
        const damage = rollMyAttack(power, level, random)
        seen[level][0] = Math.min(seen[level][0], damage)
        seen[level][1] = Math.max(seen[level][1], damage)
      }
    }
    assert.ok(seen.어려움[0] > seen.보통[1], `전투력 ${power}: 어려움 최소 ${seen.어려움[0]} ≤ 보통 최대 ${seen.보통[1]}`)
    assert.ok(seen.보통[0] > seen.쉬움[1], `전투력 ${power}: 보통 최소 ${seen.보통[0]} ≤ 쉬움 최대 ${seen.쉬움[1]}`)
    // 화면에 보여주는 범위와 실제 피해가 맞는다
    for (const level of Object.keys(seen)) {
      const [low, high] = attackRange(power, level)
      assert.ok(seen[level][0] >= low && seen[level][1] <= high)
    }
  }
})

test('방어 회복·막기도 난이도 구간 안에서 정해진다', () => {
  const random = seededRandom(7)
  for (let i = 0; i < 3000; i++) {
    for (const level of ['쉬움', '보통', '어려움']) {
      const { heal, block } = rollDefend(level, random)
      const range = BATTLE_RANGES[level]
      assert.ok(heal >= Math.round(range.heal[0]) && heal <= Math.round(range.heal[1]))
      assert.ok(block >= range.block[0] && block <= range.block[1])
    }
  }
})
