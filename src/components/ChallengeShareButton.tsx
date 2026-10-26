import { useState } from 'react'
import { ActionButton } from './ActionButton'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { createChallengeLink, shareChallenge, type Challenger } from '../lib/challenge'

// 도전장 보내기 버튼: 링크를 만들어 공유하기 창(휴대폰) 또는 복사(컴퓨터).
// 복사도 막힌 기기에서는 링크를 보여주고 직접 복사하게 한다.
export function ChallengeShareButton({
  me,
  label = '도전장 보내기',
  className = '',
  onNotice,
}: {
  me: Challenger
  label?: string
  className?: string
  onNotice: (message: string) => void
}) {
  const [manualLink, setManualLink] = useState<string | null>(null)

  async function send() {
    const link = createChallengeLink(me)
    const result = await shareChallenge(link, me.nickname)
    if (result === 'copied') onNotice('도전장 링크를 복사했어요. 친구에게 보내 보세요!')
    if (result === 'shared') onNotice('도전장을 보냈어요!')
    if (result === 'manual') setManualLink(link)
  }

  return (
    <>
      <button type="button" className={`challenge-share ${className}`} onClick={send}>
        <Icon name="quiz" size={18} /> {label}
      </button>
      {manualLink && (
        <BottomSheet title="도전장 링크" onClose={() => setManualLink(null)}>
          <p className="face-guide">아래 링크를 길게 눌러 복사한 뒤 친구에게 보내 주세요.</p>
          <input
            className="challenge-link-box"
            readOnly
            value={manualLink}
            aria-label="도전장 링크"
            onFocus={(event) => event.currentTarget.select()}
          />
          <ActionButton onClick={() => setManualLink(null)}>닫기</ActionButton>
        </BottomSheet>
      )}
    </>
  )
}
