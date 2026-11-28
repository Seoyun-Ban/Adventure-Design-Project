import type { AvatarLook, Difficulty, SubPage, Tab } from '../types'

// 이어하기: 크롬이 메모리 부족 등으로 페이지를 새로 불러와도 로그인 화면이 아니라 하던 곳으로 돌아오게 한다.
// 지금 보던 화면(홈의 탭·서브 화면, 온보딩 단계)과 고치던 내용(닉네임·성별·머리 모양·얼굴 사진)만
// 기기(localStorage)에 잠깐 적어 둔다. 비밀번호·위치는 저장하지 않는다.
// 마지막으로 적은 지 RESUME_MINUTES분이 지나면 쓰지 않아, 며칠 뒤에 앱을 처음 여는 것은 예전처럼 로그인 화면부터 시작한다.

export type ResumeLook = { nickname: string; look: AvatarLook; faceImage?: string }

export type Resume = {
  screen: 'home' | 'onboarding'
  /** 홈에서 보던 화면 */
  tab?: Tab
  page?: SubPage
  /** 온보딩 진행 */
  onboarding?: ResumeLook & { step: number; difficulty: Difficulty }
  /** 개인정보 고치기에서 고치던 내용 (저장하기 전) */
  edit?: ResumeLook & { faceStyle: string }
  savedAt: number
}

const KEY = 'history-step-resume-v1'
const RESUME_MINUTES = 30

function read(): Resume | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Resume
    if (saved.screen !== 'home' && saved.screen !== 'onboarding') return null
    if (Date.now() - saved.savedAt > RESUME_MINUTES * 60_000) return null
    return saved
  } catch {
    return null
  }
}

/** 앱을 켠 순간의 저장 내용 (이 뒤로 쓰는 값과 섞이지 않게 한 번만 읽는다) */
let boot: Resume | null = read()
/** 앱이 그 화면으로 실제로 돌아왔는지 (도전장 링크 등으로 다른 화면을 열었으면 쓰지 않는다) */
let accepted = false

export function bootScreen(): Resume['screen'] | null {
  return boot?.screen ?? null
}

export function acceptBoot() {
  accepted = true
}

/** 돌아온 화면이 처음 만들어질 때 꺼내 쓴다 (한 번 쓴 뒤에는 clearBoot로 비운다) */
export function peekBoot<K extends 'tab' | 'page' | 'onboarding' | 'edit'>(key: K): Resume[K] | undefined {
  return accepted ? boot?.[key] : undefined
}

export function clearBoot(key: 'tab' | 'page' | 'onboarding' | 'edit') {
  if (boot) boot = { ...boot, [key]: undefined }
}

/** 저장 내용 일부를 바꾼다 (실패해도 앱은 그대로) */
export function patchResume(patch: Partial<Omit<Resume, 'savedAt'>>) {
  try {
    const current = read() ?? { screen: patch.screen ?? 'home', savedAt: 0 }
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, savedAt: Date.now() }))
  } catch {
    // 저장 공간이 모자라면(사진 등) 이어하기만 포기한다
    try {
      localStorage.removeItem(KEY)
    } catch {
      // 저장소를 쓸 수 없는 환경
    }
  }
}

/** 로그인·로그아웃·처음부터 다시 시작·탈퇴 등 이어갈 곳이 없을 때 */
export function clearResume() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 저장소를 쓸 수 없는 환경
  }
}
