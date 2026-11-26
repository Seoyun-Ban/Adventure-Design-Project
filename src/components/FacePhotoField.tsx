import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from './Icon'
import { ActionButton } from './ActionButton'
import { BottomSheet } from './BottomSheet'
import { WebcamCapture } from './WebcamCapture'
import {
  detectFace,
  FaceModelError,
  getFaceModelStatus,
  onFaceModelStatus,
  preloadFaceModel,
} from '../lib/faceDetect'
import { alignFace, centerCropFace, loadPhoto } from '../lib/faceCrop'

// 얼굴 사진 넣기 (온보딩 '얼굴 등록하기'와 설정 '개인정보 고치기'에서 함께 쓴다)
// '촬영하기' → 카메라로 찍기 / 앨범에서 고르기. 얼굴을 찾아 눈 위치에 맞춰 자르고 만화풍으로 바꿔 이 기기에만 저장한다.
// 얼굴 찾기를 쓸 수 없으면 안내 문구를 띄우고 사진 가운데를 동그랗게 쓰는 기본 방식으로 넣는다.
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

  /** 사진 처리 중인지 */
  const [busy, setBusy] = useState(false)
  /** 처리 결과 안내 (얼굴을 못 찾음, 기본 방식으로 넣음 등) */
  const [notice, setNotice] = useState('')

  // 얼굴 찾기 모델이 커서, 이 화면이 열리면 미리 받아 둔다
  const [model, setModel] = useState(getFaceModelStatus())
  useEffect(() => {
    const stop = onFaceModelStatus(setModel)
    preloadFaceModel()
    return stop
  }, [])

  /** 받은 사진에서 얼굴을 찾아 맞추고 만화풍으로 바꿔 얼굴로 쓴다 (기기 안에서만 처리) */
  async function applyPhoto(photo: Blob) {
    setBusy(true)
    setNotice('')
    try {
      const image = await loadPhoto(photo)
      try {
        const face = await detectFace(image)
        if (!face) {
          setNotice('얼굴이 잘 보이지 않아요. 밝은 곳에서 정면을 바라보고 다시 찍어주세요.')
          return
        }
        onChange(alignFace(image, face))
      } finally {
        image.close()
      }
    } catch (error) {
      if (error instanceof FaceModelError) {
        try {
          onChange(await centerCropFace(photo))
          setNotice('이 기기에서는 얼굴 자동 맞춤을 쓸 수 없어 기본 방식으로 넣었어요.')
        } catch {
          setNotice('사진을 읽지 못했어요. 다른 사진으로 다시 해주세요.')
        }
      } else {
        setNotice('사진을 읽지 못했어요. 다른 사진으로 다시 해주세요.')
      }
    } finally {
      setBusy(false)
    }
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
      {(busy || notice || model.state === 'loading') && (
        <p className="face-guide face-notice" role="status">
          {model.state === 'loading'
            ? `얼굴 인식 준비 중 ${model.percent}%`
            : busy
              ? '얼굴을 찾고 있어요…'
              : notice}
        </p>
      )}
      <ActionButton variant="secondary" onClick={() => setPhotoMenu(true)} disabled={busy}>
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
