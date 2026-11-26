// 얼굴 사진을 캐릭터에 붙일 얼굴 그림으로 바꾼다. 모두 기기 안에서만 처리한다.
// - alignFace: 눈 위치로 기울기·크기·위치를 맞추고 얼굴 윤곽대로 잘라(가장자리 부드럽게) 만화풍으로 바꾼 투명 그림
// - centerCropFace: 얼굴을 못 찾는 환경용 대체 방식 (사진 가운데를 정사각형으로 잘라 만화풍으로 바꾼 동그라미용 그림)

import type { FaceShape, Point } from './faceDetect'

/** 얼굴 그림 한 변 (픽셀) */
const OUT = 256
/** 두 눈 사이 거리 / 그림 한 변. 얼굴 너비는 이 값의 약 2.2배 */
const EYE_DISTANCE = 0.3
/** 두 눈 가운데의 위에서부터 높이 / 그림 한 변. 이마와 턱이 모두 들어오게 정함 */
const EYE_Y = 0.37
/** 윤곽선을 안쪽으로 줄이는 비율 (머리카락·배경이 섞이지 않게) */
const OVAL_SHRINK = 0.96
/** 가장자리를 부드럽게 하는 번짐 반지름 (픽셀) */
const FEATHER = 5

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

/** 눈 위치로 맞추고 얼굴 윤곽대로 잘라, 만화풍으로 바꾼 투명 그림(data URL)을 만든다 */
export function alignFace(photo: ImageBitmap, face: FaceShape): string {
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
  cartoonize(data, OUT, 96)

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
  oval.forEach((p, i) => {
    const x = center.x + (p.x - center.x) * OVAL_SHRINK
    const y = center.y + (p.y - center.y) * OVAL_SHRINK
    if (i === 0) maskContext.moveTo(x, y)
    else maskContext.lineTo(x, y)
  })
  maskContext.closePath()
  maskContext.fill()
  const alpha = blurAlpha(maskContext.getImageData(0, 0, OUT, OUT).data, OUT, FEATHER)
  for (let i = 0; i < alpha.length; i += 1) data.data[i * 4 + 3] = alpha[i]

  context.putImageData(data, 0, 0)
  // 투명을 담을 수 있는 형식 (webp를 못 만드는 브라우저는 png로 저장된다)
  return canvas.toDataURL('image/webp', 0.85)
}

/** 얼굴을 못 찾는 환경용 대체 방식: 사진 가운데를 정사각형으로 잘라 만화풍으로 바꾼다 (동그라미로 보여줌) */
export async function centerCropFace(file: Blob, size = 160): Promise<string> {
  const image = await createImageBitmap(file)
  const side = Math.min(image.width, image.height)
  const small = document.createElement('canvas')
  small.width = small.height = 56
  small
    .getContext('2d')
    ?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 56, 56)
  image.close()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas unavailable')
  context.imageSmoothingQuality = 'high'
  context.drawImage(small, 0, 0, size, size)
  const data = context.getImageData(0, 0, size, size)
  applyCartoon(data, size)
  context.putImageData(data, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/** 작게 줄였다가 키워 잡티를 부드럽게 한 뒤 만화풍으로 바꾼다 */
function cartoonize(data: ImageData, size: number, soften: number) {
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

/** 색을 몇 단계로 단순화하고 밝기 차이가 큰 곳에 윤곽선을 넣는다 (제자리에서 바꿈) */
function applyCartoon(data: ImageData, size: number) {
  const px = data.data
  const levels = 6
  const lum = new Float32Array(size * size)
  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const boosted = Math.min(255, px[i + c] * 1.06 + 6)
      px[i + c] = Math.round(Math.round((boosted / 255) * (levels - 1)) * (255 / (levels - 1)))
    }
    lum[i / 4] = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
  }
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const k = y * size + x
      const gx = lum[k + 1] - lum[k - 1]
      const gy = lum[k + size] - lum[k - size]
      if (Math.hypot(gx, gy) > 70) {
        px[k * 4] *= 0.45
        px[k * 4 + 1] *= 0.4
        px[k * 4 + 2] *= 0.4
      }
    }
  }
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
