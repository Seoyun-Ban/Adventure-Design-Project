// 사진에서 얼굴 윤곽과 눈 위치를 찾는다 (MediaPipe Face Landmarker).
// 모델·실행 파일은 public/mediapipe/ 에 함께 두어 외부 서버를 쓰지 않고, 사진은 기기 밖으로 나가지 않는다.
// 용량이 커서(약 18MB) 사진을 찍거나 고른 뒤 처음 필요할 때만 불러오고, 끝나면 풀어 준다 (동적 import).

import type { FaceLandmarker } from '@mediapipe/tasks-vision'

export interface Point {
  x: number
  y: number
}

export interface FaceShape {
  /** 얼굴 윤곽선 (사진 픽셀 좌표, 순서대로 이으면 닫힌 도형) */
  oval: Point[]
  /** 사진에서 왼쪽에 보이는 눈의 가운데 */
  leftEye: Point
  /** 사진에서 오른쪽에 보이는 눈의 가운데 */
  rightEye: Point
}

/** 모델을 받지 못했거나 실행하지 못한 경우 (얼굴을 못 찾은 것과 구분한다) */
export class FaceModelError extends Error {
  constructor(cause?: unknown) {
    super('face model unavailable')
    this.name = 'FaceModelError'
    void cause
  }
}

// MediaPipe 얼굴 점 번호: 윤곽선 36개를 이은 순서, 눈 양 끝점
const OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149,
  150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
]
const LEFT_EYE = [33, 133]
const RIGHT_EYE = [362, 263]

const BASE = '/mediapipe'
const LOAD_TIMEOUT_MS = 40000
/** 받아야 하는 파일 크기 (바이트). 서버가 압축해서 보내도 진행 정도를 셀 수 있게 미리 적어 둔다 */
const MODEL_BYTES = 3758596
const WASM_BYTES = 14665716

let landmarkerPromise: Promise<FaceLandmarker> | null = null

// ── 받는 진행 정도 (화면에서 "얼굴 인식 준비 중 45%"처럼 보여 준다) ──
export type FaceModelStatus = { state: 'idle' | 'loading' | 'ready'; percent: number }
let status: FaceModelStatus = { state: 'idle', percent: 0 }
const listeners = new Set<(status: FaceModelStatus) => void>()

function setStatus(next: FaceModelStatus) {
  status = next
  listeners.forEach((listener) => listener(status))
}

export function getFaceModelStatus(): FaceModelStatus {
  return status
}

/** 진행 정도가 바뀔 때마다 알려 달라고 등록한다. 돌려받은 함수를 부르면 등록이 풀린다 */
export function onFaceModelStatus(listener: (status: FaceModelStatus) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 파일을 받으면서 받은 바이트를 알려 준다 */
async function download(url: string, onBytes: (bytes: number) => void): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok || !response.body) throw new Error(`download failed: ${url}`)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
    onBytes(value.length)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

async function create(delegate: 'GPU' | 'CPU', model: Uint8Array): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(`${BASE}/wasm`)
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: model, delegate },
    runningMode: 'IMAGE',
    numFaces: 3,
  })
}

async function load(): Promise<FaceLandmarker> {
  let received = 0
  const report = (bytes: number) => {
    received += bytes
    // 다 받은 뒤 모델을 켜는 시간이 남아 있어 99%까지만 센다
    const percent = Math.min(99, Math.round((received / (MODEL_BYTES + WASM_BYTES)) * 100))
    if (percent !== status.percent) setStatus({ state: 'loading', percent })
  }
  setStatus({ state: 'loading', percent: 0 })
  // 실행 파일(wasm)은 받아서 브라우저 저장소에 담아 두고, 뒤에서 MediaPipe가 같은 주소로 불러 쓴다
  const [model] = await Promise.all([
    download(`${BASE}/face_landmarker.task`, report),
    download(`${BASE}/wasm/vision_wasm_internal.wasm`, report),
  ])
  // 아이폰 등에서 GPU 방식이 막히는 경우가 있어 실패하면 CPU 방식으로 한 번 더 시도한다
  try {
    return await create('GPU', model)
  } catch {
    return await create('CPU', model)
  }
}

/**
 * 얼굴 찾기가 끝나면 모델을 메모리에서 풀어 준다 (휴대폰 크롬이 메모리 부족으로 페이지를 다시 불러오는 일을 줄인다).
 * 다음에 필요하면 다시 받는다 (브라우저 저장소에 있으면 빠르다).
 */
export function releaseFaceModel(): void {
  const pending = landmarkerPromise
  landmarkerPromise = null
  setStatus({ state: 'idle', percent: 0 })
  void pending?.then((landmarker) => landmarker.close()).catch(() => {})
}

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const loading = Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS)
      }),
    ])
    landmarkerPromise = loading
      .then((landmarker) => {
        setStatus({ state: 'ready', percent: 100 })
        return landmarker
      })
      .catch((error) => {
        landmarkerPromise = null // 다음에 다시 시도할 수 있게 비운다
        setStatus({ state: 'idle', percent: 0 })
        throw new FaceModelError(error)
      })
      .finally(() => clearTimeout(timer))
  }
  return landmarkerPromise
}

/**
 * 사진에서 가장 큰 얼굴을 찾는다. 얼굴이 없으면 null,
 * 모델을 쓸 수 없으면 FaceModelError를 던진다.
 */
export async function detectFace(image: ImageBitmap): Promise<FaceShape | null> {
  const landmarker = await getLandmarker()
  let faces: Point[][]
  try {
    const result = landmarker.detect(image)
    faces = result.faceLandmarks.map((points) =>
      points.map((p) => ({ x: p.x * image.width, y: p.y * image.height })),
    )
  } catch (error) {
    throw new FaceModelError(error)
  }
  if (faces.length === 0) return null

  const shapes = faces.map((points): FaceShape => {
    const mid = (ids: number[]): Point => ({
      x: (points[ids[0]].x + points[ids[1]].x) / 2,
      y: (points[ids[0]].y + points[ids[1]].y) / 2,
    })
    const a = mid(LEFT_EYE)
    const b = mid(RIGHT_EYE)
    // 사진 기준으로 왼쪽에 있는 눈을 leftEye로
    return { oval: OVAL.map((i) => points[i]), leftEye: a.x <= b.x ? a : b, rightEye: a.x <= b.x ? b : a }
  })
  return shapes.reduce((best, shape) => (ovalArea(shape.oval) > ovalArea(best.oval) ? shape : best))
}

function ovalArea(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    const q = points[(i + 1) % points.length]
    sum += p.x * q.y - q.x * p.y
  }
  return Math.abs(sum) / 2
}
