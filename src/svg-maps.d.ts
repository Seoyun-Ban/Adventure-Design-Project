// @svg-maps/south-korea 패키지에는 타입 정의가 없어서 직접 선언한다.
declare module '@svg-maps/south-korea' {
  const map: {
    label: string
    viewBox: string
    locations: { id: string; name: string; path: string }[]
  }
  export default map
}
