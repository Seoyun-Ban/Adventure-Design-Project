// 학습 글 중간 사진 배치 규칙 (화면 코드와 분리해 둔 순수 함수 → scripts/photos.test.mjs가 검사한다)
//
// 글의 자리(slot)
// - 자리 0 = 첫 문단(intro) 바로 뒤, '알고 있었나요?' 칸 위
// - 자리 j (1 이상) = '자세히 읽기' j번째 문단 뒤
// - 마지막 자리 = 마지막 문단 뒤, '잠깐, 기억해 볼까요?' 칸 위 (남는 사진이 가는 곳)
// '문단 사이'는 자리 0 ~ detailCount-1 이다.
//
// 규칙
// - 사진 순서는 항상 sources.csv에 적힌 순서와 같다 (위에서 아래로, 한 자리 안에서는 왼쪽에서 오른쪽으로)
// - 사진 1장: 첫 문단 뒤 (자리 0)
// - 사진 2장 이상: 문단 사이에 고르게. 문단 사이 자리가 모자라면 남는 사진은 모두 마지막 자리(글 끝)에 둔다
// - 한 자리에 사진이 2장 이상 모이면 화면에서 옆으로 넘기는 묶음(PhotoGroup)으로 보여 준다
// - 어떤 경우에도 받은 사진이 하나도 빠지지 않는다 (자리별 사진 수의 합 = 사진 수)
export function layoutPhotos<T>(photos: T[], detailCount: number): T[][] {
  const gaps = Math.max(1, detailCount) // 문단 사이 자리 수 (자세히 읽기 문단이 없어도 자리 0은 있다)
  const slots: T[][] = Array.from({ length: gaps + 1 }, () => [])
  const leftoverSlot = gaps
  if (photos.length === 1) {
    slots[0].push(photos[0])
  } else if (photos.length <= gaps) {
    photos.forEach((photo, index) => {
      slots[Math.floor(((index + 0.5) * gaps) / photos.length)].push(photo)
    })
  } else {
    photos.forEach((photo, index) => {
      slots[index < gaps ? index : leftoverSlot].push(photo)
    })
  }
  return slots
}

type Sized = { width: number; height: number; locked?: boolean }

/** 세로 사진인지 (세로가 더 긴 사진) */
export function isPortrait(photo: Sized) {
  return photo.height > photo.width
}

/**
 * 묶음(옆으로 넘기기) 안 사진 칸의 가로÷세로 비율. 세로 사진이나 변경금지 사진이 섞인 묶음은 모든 칸의 크기를 같게 맞춘다.
 * 가장 길쭉한 사진이 통째로 들어가는 비율이고, 나머지는 칸 안에서 원래 비율 그대로 보인다(남는 곳은 배경색).
 * 가로 사진만 있고 변경금지가 없으면 null → 예전처럼 4:3 칸에 맞춰 자른다.
 */
export function stageRatioOf(photos: Sized[]): number | null {
  if (!photos.some((photo) => isPortrait(photo) || photo.locked)) return null
  return Math.min(...photos.map((photo) => photo.width / photo.height))
}
