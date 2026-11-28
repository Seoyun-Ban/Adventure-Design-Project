// 경험치 → 레벨 계산을 검사한다 (실행: npm test)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  XP_FIRST_LEVEL,
  XP_LEVEL_STEP,
  levelFor,
  xpForLevel,
  xpNeededAt,
  xpToNextLevel,
} from '../src/lib/level.ts'

test('레벨마다 필요한 경험치가 20씩 늘어난다 (100, 120, 140 ...)', () => {
  assert.equal(xpNeededAt(1), 100)
  assert.equal(xpNeededAt(2), 120)
  assert.equal(xpNeededAt(3), 140)
  assert.equal(xpNeededAt(10), 280)
})

test('레벨에 도착하는 누적 경험치', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 100, 220, 360, 520])
})

test('경험치 → 레벨 경계값', () => {
  assert.equal(levelFor(0), 1)
  assert.equal(levelFor(99), 1)
  assert.equal(levelFor(100), 2)
  assert.equal(levelFor(219), 2)
  assert.equal(levelFor(220), 3)
  assert.equal(levelFor(359), 3)
  assert.equal(levelFor(360), 4)
  assert.equal(levelFor(-5), 1)
})

test('다음 레벨까지 남은 경험치', () => {
  assert.equal(xpToNextLevel(0), 100)
  assert.equal(xpToNextLevel(99), 1)
  assert.equal(xpToNextLevel(100), 120) // 처음 시작 상태
  assert.equal(xpToNextLevel(219), 1)
  assert.equal(xpToNextLevel(220), 140)
})

test('레벨 ↔ 누적 경험치가 서로 맞는다', () => {
  for (let level = 1; level <= 50; level++) {
    assert.equal(levelFor(xpForLevel(level)), level)
    assert.equal(levelFor(xpForLevel(level + 1) - 1), level)
  }
})

test('처음 숫자는 100과 20', () => {
  assert.ok(XP_FIRST_LEVEL === 100 && XP_LEVEL_STEP === 20)
})
