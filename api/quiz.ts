// Vercel 서버리스 함수: 학습 글을 바탕으로 Claude API가 퀴즈를 만든다.
// - API 키는 브라우저에 노출되지 않도록 서버 환경 변수(ANTHROPIC_API_KEY)에만 둔다.
// - 키가 없으면 501을 돌려주고, 앱은 기기 안의 자동 생성 퀴즈로 대신한다.
// Vercel 프로젝트 설정 → Environment Variables 에 ANTHROPIC_API_KEY (필수), ANTHROPIC_MODEL (선택) 추가

type Req = { method?: string; body?: unknown }
type Res = { status: (code: number) => Res; json: (data: unknown) => void }

const LEVEL_GUIDE: Record<string, string> = {
  쉬움: '초등학교 저학년도 풀 수 있게 쉬운 낱말로, 핵심 사실 하나만 묻는다. O/X 문제(보기 ["O","X"])와 보기 3개 문제를 섞는다.',
  보통: '초등학교 고학년 수준으로, 연도·인물·장소를 묻는다. 모두 보기 4개.',
  어려움:
    '중학생 수준으로, 연도·인물·장소와 한 일을 바르게 짝짓는 문제나 "왜 그랬을까"처럼 이유를 묻는 문제를 중심으로 낸다. 모두 보기 4개.',
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'AI not configured' })

  const {
    text,
    level,
    count = 3,
    avoid = [],
  } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    text?: string
    level?: string
    count?: number
    avoid?: string[]
  }
  if (!text || text.length > 4000 || !level || !LEVEL_GUIDE[level])
    return res.status(400).json({ error: 'bad request' })

  const prompt = `다음은 역사 학습 앱의 학습 글이다.
<학습글>
${text}
</학습글>

이 글에 나온 사실만 사용해서 퀴즈 ${Math.min(count, 5)}개를 만들어라.
- 난이도: ${level} (${LEVEL_GUIDE[level]})
- 글에 없는 내용은 묻지 말고, 오답 보기도 그럴듯하지만 분명히 틀린 것으로 한다.
- 다음 문제와는 다른 문제를 낸다: ${JSON.stringify(avoid.slice(0, 20))}
- note에는 정답을 설명하는 한 문장을 쓴다.
JSON만 출력한다. 형식: {"questions":[{"question":"...","options":["...","..."],"answer":0,"note":"..."}]} (options 개수는 난이도 규칙을 따른다)`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) return res.status(502).json({ error: 'AI request failed' })
    const data = (await response.json()) as { content?: { type: string; text?: string }[] }
    const raw = (data.content ?? []).map((block) => block.text ?? '').join('')
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    return res.status(200).json(JSON.parse(json))
  } catch {
    return res.status(502).json({ error: 'AI response invalid' })
  }
}
