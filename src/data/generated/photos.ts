// 이 파일은 npm run images가 art/photos/sources.csv를 보고 만든다. 직접 고치지 마세요.
export type PlacePhoto = {
  src: string
  /** 화면에 보이는 크기 (세로 사진은 height가 더 크다) */
  width: number
  height: number
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
      "width": 1000,
      "height": 576,
      "caption": "경복궁의 중심 건물 근정전",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1111102230000"
    },
    {
      "src": "/images/photos/gyeongbokgung/gyeonghoeru.webp",
      "width": 1000,
      "height": 482,
      "caption": "연못 위에 세운 경회루",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1111102240000"
    },
    {
      "src": "/images/photos/gyeongbokgung/gwanghwamun.webp",
      "width": 940,
      "height": 627,
      "caption": "복원된 경복궁의 정문 광화문",
      "credit": "한국관광공사(한국관광콘텐츠랩) '광화문', 공공누리 제1유형",
      "url": "https://api.visitkorea.or.kr/"
    }
  ],
  "suwon": [
    {
      "src": "/images/photos/suwon/paldalmun.webp",
      "width": 1000,
      "height": 668,
      "caption": "수원화성의 남쪽 문 팔달문",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1123104020000"
    },
    {
      "src": "/images/photos/suwon/seonggwak.webp",
      "width": 1000,
      "height": 667,
      "caption": "수원화성의 성곽 길",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333100030000"
    },
    {
      "src": "/images/photos/suwon/haenggung.webp",
      "width": 1000,
      "height": 668,
      "caption": "정조가 머물던 화성행궁",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333104780000"
    }
  ],
  "independence": [
    {
      "src": "/images/photos/independence/gyeoreui-jip.webp",
      "width": 940,
      "height": 705,
      "caption": "가운데 멀리 겨레의 집이 보이는 독립기념관 전경",
      "credit": "한국관광공사(한국관광콘텐츠랩) '독립기념관', 공공누리 제1유형",
      "url": "https://api.visitkorea.or.kr/"
    }
  ],
  "bulguksa": [
    {
      "src": "/images/photos/bulguksa/bulguksa.webp",
      "width": 600,
      "height": 399,
      "caption": "경주 불국사 전경",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333705020000"
    },
    {
      "src": "/images/photos/bulguksa/dabotap.webp",
      "width": 799,
      "height": 1000,
      "caption": "화려한 다보탑",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1113700200000"
    },
    {
      "src": "/images/photos/bulguksa/seokgatap.webp",
      "width": 667,
      "height": 1000,
      "caption": "단정한 석가탑(경주 불국사 삼층석탑)",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1113700210000"
    }
  ],
  "hansando": [
    {
      "src": "/images/photos/hansando/jeseungdang.webp",
      "width": 750,
      "height": 459,
      "caption": "한산도 제승당의 수루",
      "credit": "국가유산청, 공공누리 제1유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333801130000"
    }
  ],
  "aunae": [
    {
      "src": "/images/photos/aunae/yugwansun-yujeok.jpg",
      "width": 1024,
      "height": 683,
      "caption": "천안 유관순 열사 유적",
      "credit": "국가유산청, 공공누리 제4유형",
      "url": "https://www.heritage.go.kr/heri/cul/culSelectDetail.do?pageNo=1_1_1_1&sngl=Y&ccbaCpno=1333402300000",
      "locked": true
    },
    {
      "src": "/images/photos/aunae/aunae-park.jpg",
      "width": 940,
      "height": 528,
      "caption": "아우내 독립만세운동을 기리는 조형물",
      "credit": "한국관광공사(한국관광콘텐츠랩) '아우내독립만세운동기념공원', 공공누리 제3유형",
      "url": "https://api.visitkorea.or.kr/",
      "locked": true
    }
  ]
}
