// 얼굴 사진을 캐릭터에 붙일 얼굴 그림으로 바꾼다. 모두 기기 안에서만 처리한다.
// - alignFace: 눈 위치로 기울기·크기·위치를 맞추고 얼굴 윤곽대로 잘라(가장자리 부드럽게) 투명 그림으로 만든다.
//   '사진 그대로'(기본)는 색감만 살짝 맞추고, '만화풍'은 선·색 단계 변환을 더한다.
// - centerCropFace: 얼굴을 못 찾는 환경용 대체 방식 (사진 가운데를 정사각형으로 잘라 동그라미용 그림으로 만든다)

import type { FaceShape, Point } from './faceDetect'

/** 얼굴 그림 한 변 (픽셀). 만화풍은 어차피 뭉개지므로 작게, 사진 그대로는 캐릭터 얼굴(화면에서 약 100~150px, 확대 화면 대비)에 선명하도록 크게 */
const CARTOON_OUT = 256
const PHOTO_OUT = 384
/** FEATHER·번짐 값을 정한 기준 크기 (그림이 커지면 같은 비율로 키운다) */
const BASE_OUT = 256
/** 두 눈 사이 거리 / 그림 한 변. 얼굴 너비는 이 값의 약 2.2배 */
const EYE_DISTANCE = 0.3
/** 두 눈 가운데의 위에서부터 높이 / 그림 한 변. 이마와 턱이 모두 들어오게 정함 */
const EYE_Y = 0.37
/** 윤곽선을 안쪽으로 줄이는 비율 (머리카락·배경이 섞이지 않게. 가장자리를 넓게 번지게 하는 만큼 더 줄인다) */
const OVAL_SHRINK = 0.93
/** 가장자리를 부드럽게 하는 번짐 반지름 (픽셀). 클수록 가장자리가 넓고 부드럽게 사라진다 */
const FEATHER = 10

/**
 * 만화풍 강도 — 얼굴이 어색하면 여기 숫자만 바꾸면 된다.
 * (알아두기: 번짐을 키우고 선을 줄일수록 매끈하고 사진 느낌이 나며, 반대면 만화 느낌이 강해진다)
 */
export const CARTOON_STYLE = {
  /** 사진을 줄였다 키우는 크기 / 그림 한 변. 작을수록 더 흐려져 잡티가 사라진다 (0.2~0.4) */
  softenRatio: 0.28,
  /** 윤곽선을 찾기 전에 한 번 더 흐리게 하는 반지름 (픽셀, 0이면 안 함). 클수록 잡티가 선으로 안 그려진다 */
  lineBlur: 2,
  /** 색 단계 수. 적을수록 만화처럼 단순해진다 (4~8) */
  levels: 6,
  /** 윤곽선이 생기는 밝기 차이. 클수록 선이 적게 생긴다 (20~100) */
  lineThreshold: 45,
  /** 윤곽선 진하기 (1이면 색 그대로, 0이면 검정). 클수록 연하다 */
  lineLight: 0.72,
}

/** 얼굴 표현 방식: 사진 그대로(기본) / 만화풍 */
export type FaceStyle = 'photo' | 'cartoon'
const FACE_STYLE_KEY = 'history-step-face-style'

/** 설정에서 고른 얼굴 표현 방식 (기기에 저장, 기본은 사진 그대로). 다음에 얼굴을 등록할 때부터 적용된다 */
export function getFaceStyle(): FaceStyle {
  try {
    return localStorage.getItem(FACE_STYLE_KEY) === 'cartoon' ? 'cartoon' : 'photo'
  } catch {
    return 'photo'
  }
}

export function setFaceStyle(style: FaceStyle) {
  try {
    localStorage.setItem(FACE_STYLE_KEY, style)
  } catch {
    // 저장을 못 해도 이번 사용에는 지장 없다
  }
}

/**
 * 사진 그대로일 때의 색감 보정 — 캐릭터 그림과 어울리게 살짝만 맞춘다. 여기 숫자만 바꾸면 된다.
 * strength: 0이면 보정 없음, 1이면 가장 강함 (기본 0.5 정도가 자연스럽다)
 */
export const PHOTO_TONE = {
  strength: 0.5,
  /** 얼굴의 평균 밝기를 이 값 쪽으로 끌어온다 (0~255). 어둡거나 너무 밝은 사진을 맞춘다 */
  targetBrightness: 150,
  /** 대비를 키우는 정도 (최대치, strength를 곱해 적용) */
  contrast: 0.12,
  /** 푸른빛·회색빛을 덜어내는 정도 (최대치, strength를 곱해 적용) */
  castFix: 0.6,
  /** 따뜻한 쪽으로 기울이는 정도 (최대치, strength를 곱해 적용) */
  warmth: 0.08,
}

/** 사진을 읽는다. 아이폰 사진이 옆으로 돌아가지 않게 방향 정보를 따르고, 얼굴 찾기가 빠르도록 긴 변을 1024px 이하로 줄인다 */
export async function loadPhoto(file: Blob): Promise<ImageBitmap> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    bitmap = await createImageBitmap(file)
  }
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
  if (scale === 1) return bitmap
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) return bitmap
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return createImageBitmap(canvas)
}

/** 눈 위치로 맞추고 얼굴 윤곽대로 잘라 투명 그림(data URL)을 만든다. style이 'cartoon'이면 만화풍으로 바꾼다 */
export function alignFace(photo: ImageBitmap, face: FaceShape, style: FaceStyle = getFaceStyle()): string {
  const OUT = style === 'cartoon' ? CARTOON_OUT : PHOTO_OUT
  const feather = Math.round((FEATHER * OUT) / BASE_OUT)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = OUT
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('canvas unavailable')

  // 두 눈을 잇는 선이 수평이 되게 돌리고, 눈 사이 거리가 정해진 크기가 되게 맞춘다
  const dx = face.rightEye.x - face.leftEye.x
  const dy = face.rightEye.y - face.leftEye.y
  const distance = Math.hypot(dx, dy) || 1
  const angle = Math.atan2(dy, dx)
  const scale = (EYE_DISTANCE * OUT) / distance
  const eyeMid: Point = {
    x: (face.leftEye.x + face.rightEye.x) / 2,
    y: (face.leftEye.y + face.rightEye.y) / 2,
  }
  const cos = Math.cos(-angle) * scale
  const sin = Math.sin(-angle) * scale
  const toOut = (p: Point): Point => {
    const x = p.x - eyeMid.x
    const y = p.y - eyeMid.y
    return { x: 0.5 * OUT + x * cos - y * sin, y: EYE_Y * OUT + x * sin + y * cos }
  }

  context.fillStyle = '#f3d6bb'
  context.fillRect(0, 0, OUT, OUT)
  context.imageSmoothingQuality = 'high'
  context.setTransform(
    cos,
    sin,
    -sin,
    cos,
    0.5 * OUT - (eyeMid.x * cos - eyeMid.y * sin),
    EYE_Y * OUT - (eyeMid.x * sin + eyeMid.y * cos),
  )
  context.drawImage(photo, 0, 0)
  context.setTransform(1, 0, 0, 1, 0, 0)

  const data = context.getImageData(0, 0, OUT, OUT)
  if (style === 'cartoon') cartoonize(data, OUT)

  // 얼굴 윤곽 안쪽만 남기는 부드러운 가장자리 마스크
  const oval = face.oval.map(toOut)
  const center = oval.reduce((sum, p) => ({ x: sum.x + p.x / oval.length, y: sum.y + p.y / oval.length }), {
    x: 0,
    y: 0,
  })
  const mask = document.createElement('canvas')
  mask.width = mask.height = OUT
  const maskContext = mask.getContext('2d', { willReadFrequently: true })
  if (!maskContext) throw new Error('canvas unavailable')
  maskContext.fillStyle = '#fff'
  maskContext.beginPath()
  // 점들을 직선으로 이으면 각져 보여서, 점 사이 가운데를 이어 가는 곡선으로 그린다
  const shrunk = oval.map((p) => ({
    x: center.x + (p.x - center.x) * OVAL_SHRINK,
    y: center.y + (p.y - center.y) * OVAL_SHRINK,
  }))
  const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const start = middle(shrunk[shrunk.length - 1], shrunk[0])
  maskContext.moveTo(start.x, start.y)
  shrunk.forEach((p, i) => {
    const next = middle(p, shrunk[(i + 1) % shrunk.length])
    maskContext.quadraticCurveTo(p.x, p.y, next.x, next.y)
  })
  maskContext.closePath()
  maskContext.fill()
  const alpha = blurAlpha(maskContext.getImageData(0, 0, OUT, OUT).data, OUT, feather)
  for (let i = 0; i < alpha.length; i += 1) data.data[i * 4 + 3] = alpha[i]
  if (style === 'photo') toneFace(data)

  context.putImageData(data, 0, 0)
  // 투명을 담을 수 있는 형식 (webp를 못 만드는 브라우저는 png로 저장된다)
  return canvas.toDataURL('image/webp', style === 'cartoon' ? 0.85 : 0.8)
}

/** 얼굴을 못 찾는 환경용 대체 방식: 사진 가운데를 정사각형으로 잘라 동그라미로 보여준다 (만화풍이면 만화풍으로 바꾼다) */
export async function centerCropFace(file: Blob, style: FaceStyle = getFaceStyle()): Promise<string> {
  const cartoon = style === 'cartoon'
  const size = cartoon ? 160 : 256
  const image = await createImageBitmap(file)
  const side = Math.min(image.width, image.height)
  const small = document.createElement('canvas')
  small.width = small.height = cartoon ? 56 : size
  small
    .getContext('2d')
    ?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, small.width, small.height)
  image.close()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas unavailable')
  context.imageSmoothingQuality = 'high'
  context.drawImage(small, 0, 0, size, size)
  const data = context.getImageData(0, 0, size, size)
  if (cartoon) applyCartoon(data, size)
  else toneFace(data)
  context.putImageData(data, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * 사진 그대로일 때 밝기·대비·색감을 캐릭터 그림과 어울리게 살짝 맞춘다 (제자리에서 바꿈).
 * 투명하지 않은 부분(얼굴)의 평균으로 계산한다. 강도는 PHOTO_TONE에서 바꾼다.
 */
function toneFace(data: ImageData) {
  const { strength, targetBrightness, contrast, castFix, warmth } = PHOTO_TONE
  if (strength <= 0) return
  const px = data.data
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue
    r += px[i]
    g += px[i + 1]
    b += px[i + 2]
    count += 1
  }
  if (count === 0) return
  r /= count
  g /= count
  b /= count
  const mean = r * 0.3 + g * 0.59 + b * 0.11
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
  // 밝기: 너무 어둡거나 밝은 정도를 목표 쪽으로 약하게
  const gain = clamp(1 + (targetBrightness / Math.max(mean, 1) - 1) * strength, 0.8, 1.4)
  // 색조: 평균이 회색 쪽에서 벗어난 정도(푸른빛 등)를 덜어낸다
  const fix = strength * castFix
  const cast = [mean / Math.max(r, 1), mean / Math.max(g, 1), mean / Math.max(b, 1)].map((f) =>
    clamp(1 + (f - 1) * fix, 0.85, 1.15),
  )
  const warm = [1 + warmth * strength, 1 + warmth * strength * 0.2, 1 - warmth * strength]
  const slope = 1 + contrast * strength
  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const v = px[i + c] * gain * cast[c] * warm[c]
      px[i + c] = clamp((v - 128) * slope + 128, 0, 255)
    }
  }
}

/** 작게 줄였다가 키워 잡티를 부드럽게 한 뒤 만화풍으로 바꾼다 */
function cartoonize(data: ImageData, size: number) {
  const soften = Math.max(16, Math.round(size * CARTOON_STYLE.softenRatio))
  const source = document.createElement('canvas')
  source.width = source.height = size
  source.getContext('2d')?.putImageData(data, 0, 0)
  const small = document.createElement('canvas')
  small.width = small.height = soften
  const smallContext = small.getContext('2d')
  const target = document.createElement('canvas')
  target.width = target.height = size
  const targetContext = target.getContext('2d', { willReadFrequently: true })
  if (!smallContext || !targetContext) return
  smallContext.imageSmoothingQuality = 'high'
  smallContext.drawImage(source, 0, 0, soften, soften)
  targetContext.imageSmoothingQuality = 'high'
  targetContext.drawImage(small, 0, 0, size, size)
  const softened = targetContext.getImageData(0, 0, size, size)
  applyCartoon(softened, size)
  data.data.set(softened.data)
}

/**
 * 윤곽선을 넣고 색을 몇 단계로 단순화한다 (제자리에서 바꿈).
 * 선은 색을 단순화하기 전의 부드러운 밝기에서 찾는다. 단계 경계에서 찾으면 잡티마다 선이 생겨 지저분해진다.
 */
function applyCartoon(data: ImageData, size: number) {
  const { levels, lineThreshold, lineLight, lineBlur } = CARTOON_STYLE
  const px = data.data
  const lum = new Float32Array(size * size)
  for (let i = 0; i < px.length; i += 4) lum[i / 4] = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
  const smooth = lineBlur > 0 ? blurValues(lum, size, lineBlur) : lum

  const line = new Uint8Array(size * size)
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const k = y * size + x
      const gx = smooth[k + 1] - smooth[k - 1]
      const gy = smooth[k + size] - smooth[k - size]
      if (Math.hypot(gx, gy) > lineThreshold) line[k] = 1
    }
  }

  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const boosted = Math.min(255, px[i + c] * 1.06 + 6)
      px[i + c] = Math.round(Math.round((boosted / 255) * (levels - 1)) * (255 / (levels - 1)))
    }
    if (line[i / 4]) {
      px[i] *= lineLight
      px[i + 1] *= lineLight * 0.95
      px[i + 2] *= lineLight * 0.95
    }
  }
}

/** 값 배열(size×size)을 상자 번짐으로 부드럽게 한다 */
function blurValues(values: Float32Array, size: number, radius: number): Float32Array {
  const window = radius * 2 + 1
  const horizontal = new Float32Array(size * size)
  const result = new Float32Array(size * size)
  const clamp = (n: number) => Math.min(size - 1, Math.max(0, n))
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0
      for (let d = -radius; d <= radius; d += 1) sum += values[y * size + clamp(x + d)]
      horizontal[y * size + x] = sum / window
    }
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0
      for (let d = -radius; d <= radius; d += 1) sum += horizontal[clamp(y + d) * size + x]
      result[y * size + x] = sum / window
    }
  }
  return result
}

/** 마스크 그림의 흰 부분(빨강 값)을 상자 번짐 3번으로 부드럽게 해 투명도(0~255) 배열로 돌려준다 */
function blurAlpha(rgba: Uint8ClampedArray, size: number, radius: number): Uint8ClampedArray {
  let current = new Float32Array(size * size)
  for (let i = 0; i < current.length; i += 1) current[i] = rgba[i * 4]
  let next = new Float32Array(size * size)
  const window = radius * 2 + 1
  for (let pass = 0; pass < 3; pass += 1) {
    // 가로 방향
    for (let y = 0; y < size; y += 1) {
      let sum = 0
      for (let x = -radius; x <= radius; x += 1) sum += current[y * size + Math.min(size - 1, Math.max(0, x))]
      for (let x = 0; x < size; x += 1) {
        next[y * size + x] = sum / window
        sum +=
          current[y * size + Math.min(size - 1, x + radius + 1)] - current[y * size + Math.max(0, x - radius)]
      }
    }
    // 세로 방향
    for (let x = 0; x < size; x += 1) {
      let sum = 0
      for (let y = -radius; y <= radius; y += 1) sum += next[Math.min(size - 1, Math.max(0, y)) * size + x]
      for (let y = 0; y < size; y += 1) {
        current[y * size + x] = sum / window
        sum += next[Math.min(size - 1, y + radius + 1) * size + x] - next[Math.max(0, y - radius) * size + x]
      }
    }
  }
  next = current
  return Uint8ClampedArray.from(next)
}

/** 눈 위치에 맞춰 자른 투명 얼굴 그림인지 (예전 방식으로 저장한 동그란 JPG와 구분한다) */
export function isCutoutFace(src: string): boolean {
  return !src.startsWith('data:image/jpeg')
}
