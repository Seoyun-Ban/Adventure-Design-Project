import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionButton } from '../components/ActionButton'
import { SubpageHeader } from '../components/SubpageHeader'
import { LEVEL_POWER } from '../data/avatar'
import type { Inquiry, InquiryKind } from '../hooks/useProgress'

// 도움말: 앱 사용법 + 자주 묻는 질문 (초등학생 눈높이, 누르면 펼쳐지는 방식) + 문의하기
// 문의는 지금 기기에만 저장한다 (실제 서비스에서는 서버에 저장하고 운영팀이 답변한다).
// 내용은 실제 앱 동작과 맞아야 한다. 기능을 바꾸면 여기 설명도 함께 고친다.

type HelpItem = { q: string; a: string[] }

const guide: HelpItem[] = [
  {
    q: '발자국 남기기',
    a: [
      '역사 장소에 직접 가서 500m 안에 들어가면 그 장소가 열려요. 위치를 켜 두세요.',
      '지도에서 초록색으로 표시된 장소를 눌러요.',
      '아래에 나온 카드를 누르면 그 장소를 공부할 수 있어요.',
      "다 읽고 '학습 완료'를 누르면 지도에 내 발자국이 찍혀요.",
      '훈민정음처럼 장소가 정해지지 않은 이야기는 어디서나 배울 수 있고, 배울 때 있던 시·도에 발자국이 남아요.',
    ],
  },
  {
    q: '학습과 퀴즈',
    a: [
      '학습 화면 위에서 쉬움, 보통, 어려움 중 나에게 맞는 단계를 고를 수 있어요.',
      '중간에 있는 영상 장면의 재생 버튼을 누르면 역사 인물과 내 캐릭터가 이야기를 나눠요.',
      "'퀴즈 풀어보기'를 누르면 같은 단계의 문제 3개가 나와요. 2개 이상 맞히면 퀴즈 완료예요.",
      "지도 아래의 '퀴즈'를 누르면 학습한 장소를 골라 퀴즈를 풀 수 있어요. 이미 푼 퀴즈도 새 문제로 다시 풀 수 있어요.",
    ],
  },
  {
    q: '이야기책',
    a: [
      '배운 내용이 주제별로 책에 모여요. 예를 들어 경복궁과 수원화성은 「조선의 궁궐」 책에 들어 있어요.',
      '장소를 공부하면 그 장소의 이야기가 열리고, 책마다 얼마나 읽었는지 보여줘요.',
      '위의 검색 칸에 인물이나 장소 이름을 적으면 책을 찾을 수 있어요.',
    ],
  },
  {
    q: '아바타와 아이템',
    a: [
      '장소를 공부하면 그 장소의 역사 아이템을 얻어요. 지도 카드에서 어떤 아이템을 얻는지 미리 볼 수 있어요.',
      '아바타 탭에서 아이템을 눌러 머리, 손, 몸에 착용할 수 있어요.',
      '아이템마다 공격, 방어, 지혜 능력치가 있어요.',
    ],
  },
  {
    q: '친구와 대결',
    a: [
      "아바타 탭의 '경쟁'을 누르고 대결할 친구를 골라요. 내 대결 기록도 여기서 볼 수 있어요.",
      '역사 문제를 맞히면 공격하거나 방어할 수 있어요. 틀리면 그 차례는 넘어가요.',
      '상대의 체력을 먼저 0으로 만들면 이겨요. 끝나면 다시 도전할 수 있어요.',
      "'도전장 보내기'를 누르면 내 아바타가 담긴 링크를 진짜 친구에게 보낼 수 있어요. 얼굴 사진은 들어가지 않아요.",
    ],
  },
  {
    q: '전투력 올리는 법',
    a: [
      `전투력은 '착용한 아이템 능력치'에 '레벨 × ${LEVEL_POWER}점'을 더한 값이에요.`,
      '장소를 하나 공부할 때마다 레벨이 1씩 올라요.',
      '공부해서 얻은 아이템을 착용하면 전투력이 더 올라가요. 아바타 탭의 ⓘ 버튼에서 내 전투력 계산을 볼 수 있어요.',
    ],
  },
  {
    q: '내 정보와 설정',
    a: [
      '내 정보 탭에서 배지, 관심 장소, 학습 아카이브(지금까지 배운 기록), 도움말을 볼 수 있어요.',
      '내 정보 오른쪽 위의 톱니바퀴를 누르면 설정이 열려요. 기본 학습 단계와 알림을 바꿀 수 있어요.',
      "처음에 나온 앱 소개는 이 도움말 맨 위의 '앱 소개 다시 보기'로 언제든 다시 볼 수 있어요.",
      "설정의 '개인정보 고치기'에서 닉네임, 성별, 머리 모양, 얼굴 사진을 바꿀 수 있어요.",
      "같은 화면 아래 '계정 관리'에서 이메일과 비밀번호를 바꿀 수 있어요. 카카오·네이버·구글로 로그인했다면 그 회사에서 바꿔요.",
    ],
  },
]

const faq: HelpItem[] = [
  {
    q: '기록은 어디에 저장되나요?',
    a: [
      '발자국, 퀴즈, 아이템 같은 기록은 지금 쓰고 있는 이 기기(브라우저) 안에 저장돼요.',
      '그래서 다른 휴대폰이나 컴퓨터에서는 보이지 않아요.',
      "설정(내 정보 오른쪽 위 톱니바퀴)의 '학습 기록 초기화'를 누르면 기록이 처음 상태로 돌아가요.",
    ],
  },
  {
    q: '얼굴 사진은 어디로 가나요?',
    a: [
      '찍은 얼굴 사진은 만화처럼 바꿔서 이 기기 안에만 저장해요. 다른 곳(서버)으로 보내지 않아요.',
      '사진은 학습 영상 장면 속 내 캐릭터 얼굴에만 쓰여요.',
      "설정의 '개인정보 고치기'에서 다시 찍거나 지울 수 있어요.",
    ],
  },
  {
    q: '잠긴 장소는 어떻게 여나요?',
    a: [
      '자물쇠가 있는 장소는 그 역사 장소에 직접 찾아가서 500m 안에 들어가면 열려요.',
      '앱을 켜 두고 있으면 열릴 때 알림으로 알려줄게요. 설정에서 알림을 켜 두세요.',
      '위치가 정확하지 않으면 열리지 않을 수 있어요. 건물 밖에서 다시 해 보세요.',
    ],
  },
  {
    q: '회원 탈퇴는 어떻게 하나요?',
    a: [
      "설정 → '개인정보 고치기' 맨 아래의 '회원 탈퇴'를 눌러요.",
      '학습 기록과 아바타가 모두 지워지고, 지운 기록은 되돌릴 수 없어요. 부모님과 함께 정해 주세요.',
    ],
  },
  {
    q: '내 위치는 저장되나요?',
    a: [
      '정확한 위치는 저장하지 않아요. 어떤 장소를 방문했는지만 기억해요.',
      '위치는 앱을 보고 있을 때만 써요. 앱을 닫으면 위치를 쓰지 않아요.',
      "카카오톡 같은 앱 안에서 열면 위치를 쓸 수 없을 수 있어요. 그럴 땐 '다른 브라우저로 열기'를 눌러 주세요.",
    ],
  },
]

const INQUIRY_KINDS: InquiryKind[] = ['사용 방법', '오류 신고', '학습 내용', '기타']
const TITLE_MAX = 40
const BODY_MAX = 1000

const formatDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

export function HelpScreen({
  inquiries,
  onSendInquiry,
  onBack,
  onReplayTour,
}: {
  inquiries: Inquiry[]
  onSendInquiry: (inquiry: Pick<Inquiry, 'kind' | 'title' | 'body'>) => void
  onBack: () => void
  /** 앱 소개 안내 다시 보기 (지도로 가서 처음부터) */
  onReplayTour: () => void
}) {
  const [view, setView] = useState<'main' | 'write' | 'sent' | 'history'>('main')
  const toMain = () => setView('main')

  if (view === 'write') {
    return (
      <section className="utility-screen help-screen">
        <SubpageHeader title="문의하기" subtitle="궁금한 점이나 불편한 점을 알려 주세요" onBack={toMain} />
        <InquiryForm
          onSend={(inquiry) => {
            onSendInquiry(inquiry)
            setView('sent')
          }}
        />
      </section>
    )
  }

  if (view === 'sent') {
    return (
      <section className="utility-screen help-screen">
        <SubpageHeader title="문의하기" subtitle="운영팀이 확인하고 답변해 드려요" onBack={toMain} />
        <div className="inquiry-sent" role="status">
          <span className="auth-done-icon">
            <Icon name="check" size={30} />
          </span>
          <h2>문의를 보냈어요</h2>
          <p>답변이 오면 여기서 확인할 수 있어요.</p>
          <ActionButton onClick={() => setView('history')}>내 문의 내역 보기</ActionButton>
          <ActionButton variant="ghost" onClick={toMain}>
            도움말로 돌아가기
          </ActionButton>
        </div>
      </section>
    )
  }

  if (view === 'history') {
    return (
      <section className="utility-screen help-screen">
        <SubpageHeader title="내 문의 내역" subtitle={`모두 ${inquiries.length}건`} onBack={toMain} />
        {inquiries.length === 0 ? (
          <p className="inquiry-empty">아직 보낸 문의가 없어요.</p>
        ) : (
          inquiries.map((inquiry) => (
            <details key={inquiry.id} className="help-item inquiry-item">
              <summary>
                <span className="inquiry-head">
                  <small>
                    {inquiry.kind} · {formatDate(inquiry.createdAt)}
                  </small>
                  <strong>{inquiry.title}</strong>
                </span>
                <em className={inquiry.answer ? 'answered' : 'waiting'}>
                  {inquiry.answer ? '답변 완료' : '답변 대기 중'}
                </em>
              </summary>
              <div className="inquiry-body">
                <p>{inquiry.body}</p>
                {inquiry.answer ? (
                  <div className="inquiry-answer">
                    <strong>운영팀 답변 · {formatDate(inquiry.answer.at)}</strong>
                    <p>{inquiry.answer.body}</p>
                  </div>
                ) : (
                  <p className="inquiry-wait-note">운영팀이 확인하고 있어요. 조금만 기다려 주세요.</p>
                )}
              </div>
            </details>
          ))
        )}
      </section>
    )
  }

  return (
    <section className="utility-screen help-screen">
      <SubpageHeader title="도움말" subtitle="궁금한 항목을 눌러 보세요" onBack={onBack} />
      <button type="button" className="tour-replay" onClick={onReplayTour}>
        <span>
          <Icon name="sparkle" size={20} />
        </span>
        <span>
          <strong>앱 소개 다시 보기</strong>
          <small>화면을 하나씩 비추며 쓰는 법을 알려 줘요</small>
        </span>
        <Icon name="chevron" size={18} />
      </button>
      <HelpGroup title="앱 사용법" items={guide} />
      <HelpGroup title="자주 묻는 질문" items={faq} />
      <div className="help-group">
        <h3 className="section-title">문의하기</h3>
        <p className="help-contact-copy">찾는 답이 없나요? 운영팀에게 직접 물어보세요.</p>
        <div className="help-contact">
          <button type="button" onClick={() => setView('write')}>
            <Icon name="edit" size={20} />
            문의하기
          </button>
          <button type="button" onClick={() => setView('history')}>
            <Icon name="archive" size={20} />내 문의 내역 ({inquiries.length})
          </button>
        </div>
      </div>
    </section>
  )
}

/** 문의 쓰기: 종류, 제목, 내용. 제목과 내용을 채워야 보낼 수 있다 */
function InquiryForm({ onSend }: { onSend: (inquiry: Pick<Inquiry, 'kind' | 'title' | 'body'>) => void }) {
  const [kind, setKind] = useState<InquiryKind>('사용 방법')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const canSend = title.trim().length > 0 && body.trim().length > 0

  return (
    <div className="inquiry-form">
      <div className="field">
        <span id="inquiry-kind">문의 종류</span>
        <div className="settings-segments inquiry-kinds" role="group" aria-labelledby="inquiry-kind">
          {INQUIRY_KINDS.map((item) => (
            <button
              type="button"
              key={item}
              className={kind === item ? 'active' : ''}
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>제목</span>
        <input
          maxLength={TITLE_MAX}
          placeholder="예: 퀴즈가 다음으로 넘어가지 않아요"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="field">
        <span className="field-label-row">
          내용
          <em>
            {body.length}/{BODY_MAX}
          </em>
        </span>
        <textarea
          maxLength={BODY_MAX}
          rows={6}
          placeholder="어떤 화면에서 무엇을 했는지 자세히 적어 주면 더 빨리 도와줄 수 있어요."
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <ActionButton
        disabled={!canSend}
        onClick={() => canSend && onSend({ kind, title: title.trim(), body: body.trim() })}
      >
        보내기
      </ActionButton>
      {!canSend && <p className="auth-note">제목과 내용을 적으면 보낼 수 있어요.</p>}
    </div>
  )
}

function HelpGroup({ title, items }: { title: string; items: HelpItem[] }) {
  return (
    <div className="help-group">
      <h3 className="section-title">{title}</h3>
      {items.map((item) => (
        <details key={item.q} className="help-item">
          <summary>{item.q}</summary>
          <ul>
            {item.a.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  )
}
