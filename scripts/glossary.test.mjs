// 낱말 풀이 밑줄이 낱말 일부에 잘못 그어지지 않는지 검사한다 (실행: npm test)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GLOSSARY } from '../src/data/glossary.ts'
import { annotate, findWordMatches, glossaryLine } from '../src/lib/glossary.ts'
import { readContents } from './lib/readContents.mjs'

const marked = (texts) => annotate(texts).map((segments) => segments.filter((s) => s.entry).map((s) => s.text))
const HANGUL = /[가-힣]/

test('낱말 목록: 낱말이 겹치지 않고 풀이가 있다', () => {
  const words = GLOSSARY.map((entry) => entry.word)
  assert.equal(new Set(words).size, words.length, '같은 낱말이 두 번 적혀 있음')
  for (const entry of GLOSSARY) {
    assert.ok(entry.word && entry.meaning, `${entry.word}: 풀이가 비어 있음`)
    assert.ok(!entry.meaning.includes('시험') && !entry.meaning.includes('예시'), `${entry.word}: 화면에 쓰면 안 되는 말`)
  }
})

test('다른 낱말의 일부에는 밑줄이 그어지지 않는다', () => {
  // 근정전 안의 정전
  assert.deepEqual(marked(['근정전 앞의 근정전은 큽니다.']), [[]])
  // 활시위·시위대·무의식·의식주·장인어른·조회수
  assert.deepEqual(marked(['활시위를 당겼어요.']), [[]])
  assert.deepEqual(marked(['시위대가 모였어요.']), [[]])
  assert.deepEqual(marked(['무의식 속에서']), [[]])
  assert.deepEqual(marked(['의식주를 살펴봐요.']), [[]])
  assert.deepEqual(marked(['장인어른과 함께']), [[]])
  assert.deepEqual(marked(['조회수가 많아요.']), [[]])
  // 낱말 그대로(조사가 붙은 것 포함)는 그어진다
  assert.deepEqual(marked(['궁궐의 정전이고 큰 건물이에요.']), [['정전']])
  assert.deepEqual(marked(['만세 시위를 이끌었어요.']), [['시위']])
  assert.deepEqual(marked(['국가 의식을 치렀어요.']), [['의식']])
  assert.deepEqual(marked(['도읍을 옮긴 뒤']), [['도읍']])
  assert.deepEqual(marked(['수원 화산으로 옮기고']), [['화산']])
})

test('앞에 일부만 맞는 자리가 있어도 진짜 낱말 자리를 찾는다', () => {
  // 근정전은 건너뛰고 뒤의 '정전'에 긋는다
  assert.deepEqual(marked(['근정전은 나라의 정전이에요.']), [['정전']])
})

test('낱말마다 처음 나오는 곳에만 밑줄이 그어진다 (글이 여러 개여도)', () => {
  const result = marked(['의식을 치렀어요. 또 다른 의식도 있어요.', '여기도 의식이 나와요.', '사신을 맞았어요.'])
  assert.deepEqual(result, [['의식'], [], ['사신']])
  // 각 글의 조각을 이어 붙이면 원래 글이 그대로다
  const texts = ['법궁은 으뜸 궁궐이에요. 법궁!', '누각에서 사신을 맞았어요.']
  annotate(texts).forEach((segments, i) => assert.equal(segments.map((s) => s.text).join(''), texts[i]))
})

test('풀이 창 글: 낱말(한자) - 풀이, 한자가 없으면 낱말 - 풀이', () => {
  const find = (word) => GLOSSARY.find((entry) => entry.word === word)
  assert.equal(glossaryLine(find('정전')), '정전(正殿) - 궁궐에서 나라의 큰 행사를 치르던 가장 중요한 건물')
  assert.equal(glossaryLine(find('품삯')), '품삯 - 일을 한 대가로 받는 돈')
})

test('실제 학습 글: 밑줄은 항상 낱말 그대로에만, 괄호 풀이는 남아 있지 않다', async () => {
  const contents = await readContents()
  assert.ok(Object.keys(contents).length >= 6, '학습 글을 읽지 못함 (contents.ts 모양이 바뀌었는지 확인)')
  for (const [id, place] of Object.entries(contents)) {
    for (const level of ['쉬움', '보통', '어려움']) {
      const texts = [place[level].intro, place.didYouKnow, ...place[level].paragraphs, place.remember]
      const original = texts.join('\u0000')
      const segments = annotate(texts)
      assert.equal(
        segments.map((parts) => parts.map((s) => s.text).join('')).join('\u0000'),
        original,
        `${id} ${level}: 조각을 이으면 원래 글과 달라짐`,
      )
      // 밑줄 낱말 바로 앞은 한글이 아니어야 한다 (다른 낱말의 일부가 아님)
      segments.forEach((parts, textIndex) => {
        let before = ''
        for (const part of parts) {
          if (part.entry) {
            const last = before.slice(-1)
            assert.ok(!HANGUL.test(last), `${id} ${level}: '${before.slice(-4)}${part.text}' — 낱말 일부에 밑줄이 그어짐`)
            assert.deepEqual(findWordMatches(texts[textIndex], part.text).length > 0, true)
          }
          before += part.text
        }
      })
      // 한 학습 단계 안에서 같은 낱말에 밑줄이 두 번 그어지지 않는다
      const words = segments.flat().filter((s) => s.entry).map((s) => s.text)
      assert.equal(new Set(words).size, words.length, `${id} ${level}: 같은 낱말에 밑줄이 두 번`)
    }
    // 괄호로 붙였던 풀이는 낱말 풀이로 대신했다
    for (const level of ['쉬움', '보통', '어려움']) {
      assert.ok(!place[level].detail.includes('花山'), `${id} ${level}: 괄호 풀이가 남아 있음`)
      assert.ok(!place[level].intro.includes('花山'), `${id} ${level}: 괄호 풀이가 남아 있음`)
    }
  }
})
