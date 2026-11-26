// 사진에서 얼굴 윤곽과 눈 위치를 찾는다 (MediaPipe Face Landmarker).
// 모델·실행 파일은 public/mediapipe/ 에 함께 두어 외부 서버를 쓰지 않고, 사진은 기기 밖으로 나가지 않는다.
// 용량이 커서(약 18MB) 얼굴 등록 화면에서 처음 필요할 때만 불러온다 (동적 import).

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
const LOAD_TIMEOUT_MS = 20000

let landmarkerPromise: Promise<FaceLandmarker> | null = null

async function create(delegate: 'GPU' | 'CPU'): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(`${BASE}/wasm`)
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: `${BASE}/face_landmarker.task`, delegate },
    runningMode: 'IMAGE',
    numFaces: 3,
  })
}

async function load(): Promise<FaceLandmarker> {
  // 아이폰 등에서 GPU 방식이 막히는 경우가 있어 실패하면 CPU 방식으로 한 번 더 시도한다
  try {
    return await create('GPU')
  } catch {
    return await create('CPU')
  }
}

/** 모델 받기를 미리 시작한다 (얼굴 등록 화면이 열릴 때 부른다). 실패해도 조용히 넘어간다 */
export function preloadFaceModel(): void {
  void getLandmarker().catch(() => {})
}

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    const loading = Promise.race([
      load(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS)),
    ])
    landmarkerPromise = loading.catch((error) => {
      landmarkerPromise = null // 다음에 다시 시도할 수 있게 비운다
      throw new FaceModelError(error)
    })
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
