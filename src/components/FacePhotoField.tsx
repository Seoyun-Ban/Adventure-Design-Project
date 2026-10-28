import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { BottomSheet } from './BottomSheet'
import { WebcamCapture } from './WebcamCapture'

// 얼굴 사진 넣기 (온보딩 '얼굴 등록하기'와 설정 '개인정보 고치기'에서 함께 쓴다)
// '촬영하기' → 카메라로 찍기 / 앨범에서 고르기. 사진은 만화풍으로 바꿔 이 기기에만 저장한다.
export function FacePhotoField({
  faceImage,
  onChange,
}: {
  faceImage?: string
  onChange: (faceImage: string | undefined) => void
}) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const albumInput = useRef<HTMLInputElement>(null)
  /** '촬영하기'를 누르면 여는 "카메라로 찍기 / 앨범에서 고르기" 창 */
  const [photoMenu, setPhotoMenu] = useState(false)
  /** 컴퓨터의 웹캠 촬영 창 */
  const [webcam, setWebcam] = useState(false)

  /** 받은 사진을 만화풍으로 바꿔 얼굴로 쓴다 (기기 안에서만 처리) */
  async function applyPhoto(photo: Blob) {
    onChange(await resizeImage(photo, 160))
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    input.value = '' // 같은 사진을 다시 골라도 바뀌도록
    if (file) await applyPhoto(file)
  }

  /** 휴대폰(터치 화면)은 앞면 카메라 입력, 컴퓨터는 웹캠 화면 */
  function takeWithCamera() {
    setPhotoMenu(false)
    if (window.matchMedia('(pointer: coarse)').matches) cameraInput.current?.click()
    else setWebcam(true)
  }

  function pickFromAlbum() {
    setPhotoMenu(false)
    setWebcam(false)
    albumInput.current?.click()
  }

  return (
    <>
      <div className={`face-frame ${faceImage ? 'has-photo' : ''}`}>
        {faceImage ? <img src={faceImage} alt="등록한 얼굴" /> : <Icon name="user" size={46} />}
        <i />
      </div>
      <p className="face-guide">
        정면을 바라보고 얼굴이 원 안에 들어오게 찍어주세요.
        <br />
        사진은 이 기기에만 저장돼요.
      </p>
      {/* 휴대폰: 앞면 카메라로 바로 찍기 / 사진 앨범에서 고르기 */}
      <input ref={cameraInput} type="file" accept="image/*" capture="user" hidden onChange={handlePhoto} />
      <input ref={albumInput} type="file" accept="image/*" hidden onChange={handlePhoto} />
      <ActionButton variant="secondary" onClick={() => setPhotoMenu(true)}>
        <Icon name="camera" size={18} /> {faceImage ? '다시 찍기' : '촬영하기'}
      </ActionButton>
      {faceImage && (
        <button type="button" className="text-link" onClick={() => onChange(undefined)}>
          사진 지우기
        </button>
      )}
      {photoMenu && (
        <BottomSheet title="얼굴 사진 넣기" onClose={() => setPhotoMenu(false)}>
          <div className="photo-choices">
            <button type="button" onClick={takeWithCamera}>
              <span>
                <Icon name="camera" size={22} />
              </span>
              카메라로 찍기
            </button>
            <button type="button" onClick={pickFromAlbum}>
              <span>
                <Icon name="image" size={22} />
              </span>
              앨범에서 고르기
            </button>
          </div>
          <p className="face-guide">사진은 만화풍으로 바뀌어 이 기기에만 저장돼요.</p>
        </BottomSheet>
      )}
      {webcam && (
        <WebcamCapture
          onClose={() => setWebcam(false)}
          onUseAlbum={pickFromAlbum}
          onCapture={(photo) => {
            setWebcam(false)
            void applyPhoto(photo)
          }}
        />
      )}
    </>
  )
}

/**
 * 사진을 정사각형으로 잘라 작게 줄이고, 2D 캐릭터와 어울리도록 만화풍으로 바꾼다.
 * (색 단순화 + 부드럽게 + 윤곽선) — 사진은 서버로 보내지 않고 기기 안에서만 처리한다.
 */
function resizeImage(file: Blob, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const image = new Image()
      image.onerror = reject
      image.onload = () => {
        const side = Math.min(image.width, image.height)
        // 1) 작게 줄였다가 키워서 잔주름·잡티를 부드럽게
        const small = document.createElement('canvas')
        small.width = small.height = 56
        small
          .getContext('2d')
          ?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 56, 56)
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('canvas unavailable'))
        context.imageSmoothingQuality = 'high'
        context.drawImage(small, 0, 0, size, size)
        // 2) 색을 몇 단계로 단순화 (만화 채색 느낌)
        const data = context.getImageData(0, 0, size, size)
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
        // 3) 밝기 차이가 큰 곳에 윤곽선
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
        context.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
