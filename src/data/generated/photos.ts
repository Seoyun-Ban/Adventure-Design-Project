// 이 파일은 npm run images가 art/photos/sources.csv를 보고 만든다. 직접 고치지 마세요.
export type PlacePhoto = {
  src: string
  caption: string
  credit: string
  url?: string
  crop?: 'top' | 'center' | 'bottom' | 'left' | 'right'
  /** 변경금지(공공누리 제3·4유형): 원본 그대로, 자르기·크기 조절 없이 보여 준다 */
  locked?: true
}
export const PLACE_PHOTOS: Record<string, PlacePhoto[]> = {
  "gyeongbokgung": [
    {
      "src": "/images/photos/gyeongbokgung/geunjeongjeon.webp",
      "caption": "경복궁의 중심 건물 근정전",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1111102230000"
    },
    {
      "src": "/images/photos/gyeongbokgung/gyeonghoeru.webp",
      "caption": "연못 위에 세운 경회루",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1111102240000"
    },
    {
      "src": "/images/photos/gyeongbokgung/gwanghwamun.webp",
      "caption": "복원된 경복궁의 정문 광화문",
      "credit": "한국관광공사, 공공누리 제1유형",
      "url": "https://api.visitkorea.or.kr/#/hubTourSearchDetail"
    }
  ],
  "suwon": [
    {
      "src": "/images/photos/suwon/paldalmun.webp",
      "caption": "수원화성의 남쪽 문 팔달문",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1123104020000"
    },
    {
      "src": "/images/photos/suwon/seonggwak.webp",
      "caption": "수원화성의 성곽 길",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333100030000"
    },
    {
      "src": "/images/photos/suwon/haenggung.webp",
      "caption": "정조가 머물던 화성행궁",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333104780000"
    }
  ],
  "independence": [
    {
      "src": "/images/photos/independence/gyeoreui-jip.webp",
      "caption": "가운데 멀리 겨레의 집이 보이는 독립기념관 전경",
      "credit": "한국관광공사, 공공누리 제1유형",
      "url": "https://api.visitkorea.or.kr/#/hubTourSearchDetail"
    }
  ],
  "bulguksa": [
    {
      "src": "/images/photos/bulguksa/bulguksa.webp",
      "caption": "경주 불국사 전경",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333705020000"
    }
  ],
  "hansando": [
    {
      "src": "/images/photos/hansando/jeseungdang.webp",
      "caption": "한산도 제승당의 수루",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333801130000"
    }
  ],
  "aunae": [
    {
      "src": "/images/photos/aunae/yugwansun-yujeok.jpg",
      "caption": "천안 유관순 열사 유적",
      "credit": "국가유산청, 공공누리 제4유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333402300000",
      "locked": true
    },
    {
      "src": "/images/photos/aunae/aunae-park.jpg",
      "caption": "아우내 독립만세운동을 기리는 조형물",
      "credit": "한국관광공사, 공공누리 제3유형",
      "url": "https://api.visitkorea.or.kr/#/hubTourSearchDetail",
      "locked": true
    }
  ]
}
