// 학습 글 중간 사진 배치 규칙 (화면 코드와 분리해 둔 순수 함수 → scripts/photos.test.mjs가 검사한다)
//
// 글의 자리(slot)
// - 자리 0 = 첫 문단(intro) 바로 뒤, '알고 있었나요?' 칸 위
// - 자리 j (1 이상) = '자세히 읽기' j번째 문단 뒤
// '문단 사이'는 자리 0 ~ detailCount-1 이다 (마지막 문단 뒤는 글 끝이라 문단 사이가 아님).
//
// 규칙
// - 사진 1장: 첫 문단 뒤 (자리 0)
// - 사진 2장 이상: 문단 사이에 고르게. 문단 사이 자리가 모자라면 남는 사진은 모두 '알고 있었나요?' 위(자리 0)에 둔다
// - 어떤 경우에도 받은 사진이 하나도 빠지지 않는다 (자리별 사진 수의 합 = 사진 수)
export const LEFTOVER_SLOT = 0

export function layoutPhotos<T>(photos: T[], detailCount: number): T[][] {
  const gaps = Math.max(1, detailCount) // 문단 사이 자리 수 (자세히 읽기 문단이 없어도 자리 0은 있다)
  const slots: T[][] = Array.from({ length: gaps + 1 }, () => [])
  if (photos.length === 1) {
    slots[0].push(photos[0])
  } else if (photos.length <= gaps) {
    photos.forEach((photo, index) => {
      slots[Math.floor(((index + 0.5) * gaps) / photos.length)].push(photo)
    })
  } else {
    photos.forEach((photo, index) => {
      slots[index < gaps ? index : LEFTOVER_SLOT].push(photo)
    })
  }
  return slots
}
