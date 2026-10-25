import { useId } from 'react'
import type { AvatarLook, Equipped } from '../types'

// 레이어 방식으로 그린 2D 캐릭터 (사용자 아바타와 역사 인물 공용)
// 기본 외형(성별·체형·머리·피부색) 위에 장비(머리) / 무기(손) / 의복(몸)을 겹쳐 그린다.
// faceImage가 있으면 얼굴 자리에 등록한 얼굴(만화풍으로 변환한 사진)이 들어간다.

const OL = '#3b2a22' // 외곽선
const HAIR = '#2b2420'

type Outfit = { main: string; shade: string; trim: string; belt: string; long?: boolean }

const outfits: Record<string, Outfit> = {
  base: { main: '#fbf4e4', shade: '#e6dcc4', trim: '#2f6b50', belt: '#2f6b50' },
  'official-robe': { main: '#c0463a', shade: '#9a3329', trim: '#7d241c', belt: '#2a2a2a', long: true },
  'hwarang-robe': { main: '#2f8a9a', shade: '#22707d', trim: '#e2b04a', belt: '#b23a2e', long: true },
  armor: { main: '#7a3f2c', shade: '#5f2f20', trim: '#e2b04a', belt: '#3b2418' },
  // 역사 인물 전용 의상
  'royal-robe': { main: '#c8312b', shade: '#a12520', trim: '#e2b04a', belt: '#e2b04a', long: true },
  'silla-noble': { main: '#7b5aa6', shade: '#614587', trim: '#e2b04a', belt: '#e2b04a', long: true },
}

export function Avatar({
  look,
  equipped,
  faceImage,
  beard,
  talking = false,
  className = '',
  label = '아바타',
}: {
  look: AvatarLook
  equipped: Equipped
  faceImage?: string
  beard?: 'mustache' | 'beard'
  talking?: boolean
  className?: string
  label?: string
}) {
  const id = useId().replace(/:/g, '')
  const torsoW = look.body === '마름' ? 52 : look.body === '튼튼' ? 70 : 60
  const left = 80 - torsoW / 2
  const right = left + torsoW
  const outfitId = equipped.의복 ?? 'base'
  const outfit = outfits[outfitId] ?? outfits.base
  const skirt = look.gender === '여' && outfitId === 'base'
  const hem = outfit.long ? 198 : 172
  const skinShade = shade(look.skin, -18)

  return (
    <svg className={`avatar-svg ${className}`} viewBox="0 0 160 220" role="img" aria-label={label}>
      <defs>
        <clipPath id={`face-${id}`}>
          <circle cx="80" cy="74" r="30" />
        </clipPath>
        <linearGradient id={`hair-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3d35" />
          <stop offset="1" stopColor={HAIR} />
        </linearGradient>
      </defs>

      {/* 그림자 */}
      <ellipse cx="80" cy="211" rx="38" ry="6" fill="rgba(40,40,30,.18)" />

      {/* 긴 머리 (몸 뒤) */}
      {look.hair === '긴 머리' && !equipped.장비 && (
        <path
          d="M45 74 Q40 132 56 142 L104 142 Q120 132 115 74 Z"
          fill={`url(#hair-${id})`}
          stroke={OL}
          strokeWidth="2"
        />
      )}

      {/* 다리 / 치마 */}
      {skirt ? (
        <path
          d={`M${left - 4} 150 Q80 140 ${right + 4} 150 L${right + 16} 204 Q80 212 ${left - 16} 204 Z`}
          fill="#d0566a"
          stroke={OL}
          strokeWidth="2"
        />
      ) : (
        <g stroke={OL} strokeWidth="2">
          <rect x={80 - torsoW / 4 - 9} y="160" width="17" height="42" rx="7" fill="#3d5245" />
          <rect x={80 + torsoW / 4 - 8} y="160" width="17" height="42" rx="7" fill="#3d5245" />
          <ellipse cx={80 - torsoW / 4 - 1} cy="204" rx="12" ry="6" fill="#2a2a2a" />
          <ellipse cx={80 + torsoW / 4 + 1} cy="204" rx="12" ry="6" fill="#2a2a2a" />
        </g>
      )}

      {/* 몸통 (의복) */}
      <path
        d={`M${left} 114 Q80 102 ${right} 114 L${right + (outfit.long ? 10 : 3)} ${hem} Q80 ${hem + 7} ${left - (outfit.long ? 10 : 3)} ${hem} Z`}
        fill={outfit.main}
        stroke={OL}
        strokeWidth="2.2"
      />
      <path
        d={`M${right - 6} 118 L${right + (outfit.long ? 8 : 1)} ${hem - 2} L${right - 12} ${hem} Z`}
        fill={outfit.shade}
        opacity=".7"
      />
      {/* 깃 */}
      <path
        d="M69 106 L80 130 L91 106"
        fill="none"
        stroke={outfit.trim}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <OutfitDetail outfitId={outfitId} outfit={outfit} left={left} right={right} torsoW={torsoW} hem={hem} />
      {/* 허리띠 / 고름 */}
      {outfitId === 'base' ? (
        <path d="M85 126 l11 20 M85 126 l2 22" stroke={outfit.trim} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <rect
          x={left - 3}
          y="150"
          width={torsoW + 6}
          height="8"
          rx="4"
          fill={outfit.belt}
          stroke={OL}
          strokeWidth="1.6"
        />
      )}

      {/* 팔 */}
      <g stroke={OL} strokeWidth="2">
        <rect
          x={left - 14}
          y="114"
          width="16"
          height="46"
          rx="8"
          fill={outfit.main}
          transform={`rotate(12 ${left - 6} 114)`}
        />
        <rect
          x={right - 2}
          y="114"
          width="16"
          height="46"
          rx="8"
          fill={outfit.main}
          transform={`rotate(-16 ${right + 6} 114)`}
        />
        <circle cx={left - 10} cy="160" r="7.5" fill={look.skin} />
        <circle cx={right + 17} cy="157" r="7.5" fill={look.skin} />
      </g>

      {/* 손에 든 무기 */}
      <HandItem id={equipped.무기} x={right + 17} y={157} />

      {/* 목 + 머리 */}
      <rect x="72" y="98" width="16" height="12" rx="5" fill={skinShade} />
      <ellipse cx="46.5" cy="78" rx="5" ry="7" fill={look.skin} stroke={OL} strokeWidth="2" />
      <ellipse cx="113.5" cy="78" rx="5" ry="7" fill={look.skin} stroke={OL} strokeWidth="2" />
      <circle cx="80" cy="74" r="34" fill={look.skin} stroke={OL} strokeWidth="2.4" />

      {faceImage ? (
        <>
          <image
            href={faceImage}
            x="50"
            y="44"
            width="60"
            height="60"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#face-${id})`}
          />
          <circle cx="80" cy="74" r="30" fill="none" stroke={look.skin} strokeWidth="5" />
        </>
      ) : (
        <Face gender={look.gender} talking={talking} />
      )}
      {faceImage && talking && (
        <ellipse className="talk-mouth" cx="80" cy="94" rx="5" ry="3" fill="#7a3b2e" opacity=".85" />
      )}
      {beard && <Beard type={beard} />}

      {/* 앞머리 */}
      {!equipped.장비 && (
        <>
          <path
            d="M45 74 Q44 38 80 37 Q116 38 115 74 Q110 58 98 54 Q92 62 80 60 Q70 56 62 58 Q52 62 45 74 Z"
            fill={`url(#hair-${id})`}
            stroke={OL}
            strokeWidth="2.2"
          />
          <path
            d="M62 45 Q72 40 84 41"
            stroke="rgba(255,255,255,.35)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {look.hair === '상투·쪽머리' &&
            (look.gender === '남' ? (
              <ellipse cx="80" cy="34" rx="9" ry="10" fill={HAIR} stroke={OL} strokeWidth="2" />
            ) : (
              <ellipse cx="114" cy="88" rx="10" ry="9" fill={HAIR} stroke={OL} strokeWidth="2" />
            ))}
        </>
      )}

      {/* 머리에 쓰는 장비 */}
      <HeadItem id={equipped.장비} />
    </svg>
  )
}

function Face({ gender, talking }: { gender: AvatarLook['gender']; talking: boolean }) {
  return (
    <g>
      <path
        d="M62 66 Q68 62 74 65 M86 65 Q92 62 98 66"
        stroke={OL}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="68" cy="77" rx="4.6" ry="5.8" fill="#2b2420" />
      <ellipse cx="92" cy="77" rx="4.6" ry="5.8" fill="#2b2420" />
      <circle cx="69.6" cy="75" r="1.8" fill="white" />
      <circle cx="93.6" cy="75" r="1.8" fill="white" />
      {gender === '여' && (
        <path d="M62 73 l-3 -2 M98 73 l3 -2" stroke={OL} strokeWidth="1.8" strokeLinecap="round" />
      )}
      <ellipse cx="59" cy="88" rx="6.5" ry="3.6" fill="#ec8b7b" opacity={gender === '여' ? 0.6 : 0.4} />
      <ellipse cx="101" cy="88" rx="6.5" ry="3.6" fill="#ec8b7b" opacity={gender === '여' ? 0.6 : 0.4} />
      {talking ? (
        <ellipse className="talk-mouth" cx="80" cy="92" rx="5" ry="3.6" fill="#7a3b2e" />
      ) : (
        <path d="M73 90 Q80 97 87 90" fill="none" stroke="#7a3b2e" strokeWidth="2.6" strokeLinecap="round" />
      )}
    </g>
  )
}

function Beard({ type }: { type: 'mustache' | 'beard' }) {
  return (
    <g fill="#2b2420" stroke={OL} strokeWidth="1.2">
      <path d="M68 87 Q74 83 80 86 Q86 83 92 87 Q86 90 80 88 Q74 90 68 87 Z" />
      {type === 'beard' && <path d="M72 98 Q80 118 88 98 Q84 102 80 101 Q76 102 72 98 Z" />}
    </g>
  )
}

function OutfitDetail({
  outfitId,
  outfit,
  left,
  right,
  torsoW,
  hem,
}: {
  outfitId: string
  outfit: Outfit
  left: number
  right: number
  torsoW: number
  hem: number
}) {
  if (outfitId === 'official-robe') {
    return (
      <>
        <circle cx="80" cy="112" r="9" fill="none" stroke={outfit.trim} strokeWidth="4" />
        <rect x="66" y="128" width="28" height="18" rx="3" fill="#e2b04a" stroke={OL} strokeWidth="1.4" />
        <path d="M72 137 h16" stroke="#9a3329" strokeWidth="2" />
      </>
    )
  }
  if (outfitId === 'royal-robe') {
    // 곤룡포: 가슴의 둥근 금색 보(용 무늬)
    return (
      <>
        <circle cx="80" cy="134" r="12" fill="#e2b04a" stroke={OL} strokeWidth="1.6" />
        <path
          d="M73 136 Q77 128 82 133 Q86 138 89 130"
          stroke="#a12520"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="86" cy="131" r="1.4" fill="#a12520" />
      </>
    )
  }
  if (outfitId === 'armor') {
    return (
      <>
        <g stroke={outfit.trim} strokeWidth="1.6" fill="none" opacity=".9">
          {[132, 142, 162].map((y) => (
            <path
              key={y}
              d={`M${left + 5} ${y} Q${left + 14} ${y + 6} ${left + 24} ${y} Q${left + 34} ${y + 6} ${left + 44} ${y} Q${left + 54} ${y + 6} ${right - 4} ${y}`}
            />
          ))}
        </g>
        <ellipse cx={left + 1} cy="117" rx="14" ry="8" fill={outfit.trim} stroke={OL} strokeWidth="1.6" />
        <ellipse cx={right - 1} cy="117" rx="14" ry="8" fill={outfit.trim} stroke={OL} strokeWidth="1.6" />
      </>
    )
  }
  if (outfitId === 'hwarang-robe' || outfitId === 'silla-noble') {
    return (
      <path
        d={`M${left + 2} ${hem - 10} L${left + torsoW - 2} ${hem - 10}`}
        stroke={outfit.trim}
        strokeWidth="5"
      />
    )
  }
  return null
}

function HeadItem({ id }: { id?: string }) {
  if (id === 'gat') {
    return (
      <g>
        <path
          d="M45 70 Q46 42 80 42 Q114 42 115 70 Q104 58 80 59 Q56 58 45 70 Z"
          fill={HAIR}
          stroke={OL}
          strokeWidth="2"
        />
        <rect
          x="62"
          y="16"
          width="36"
          height="32"
          rx="7"
          fill="#1f1f1f"
          opacity=".85"
          stroke={OL}
          strokeWidth="1.6"
        />
        <ellipse cx="80" cy="47" rx="52" ry="8.5" fill="#1f1f1f" opacity=".88" />
        <path
          d="M58 52 Q55 98 64 106 M102 52 Q105 98 96 106"
          stroke="#1f1f1f"
          strokeWidth="1.4"
          fill="none"
        />
      </g>
    )
  }
  if (id === 'ikseongwan') {
    // 익선관: 왕이 쓰던 모자 (뒤에 매미 날개 모양)
    return (
      <g stroke={OL} strokeWidth="1.8">
        <ellipse cx="54" cy="34" rx="12" ry="7" fill="#262626" transform="rotate(-25 54 34)" />
        <ellipse cx="106" cy="34" rx="12" ry="7" fill="#262626" transform="rotate(25 106 34)" />
        <path d="M46 66 Q46 30 80 28 Q114 30 114 66 Q100 58 80 58 Q60 58 46 66 Z" fill="#1f1f1f" />
        <rect x="47" y="56" width="66" height="9" rx="4" fill="#333" />
      </g>
    )
  }
  if (id === 'helmet') {
    return (
      <g stroke={OL} strokeWidth="1.8">
        <path d="M43 68 Q43 28 80 28 Q117 28 117 68 Z" fill="#5a4636" />
        <path
          d="M43 68 L39 96 Q46 101 53 94 L55 68 Z M117 68 L121 96 Q114 101 107 94 L105 68 Z"
          fill="#5a4636"
        />
        <rect x="41" y="61" width="78" height="9" rx="4.5" fill="#e2b04a" />
        <path d="M80 28 L80 10" stroke="#e2b04a" strokeWidth="4" strokeLinecap="round" />
        <circle cx="80" cy="9" r="5" fill="#c0463a" />
      </g>
    )
  }
  if (id === 'liberation-cap') {
    return (
      <g stroke={OL} strokeWidth="1.8">
        <path d="M45 64 Q45 32 80 32 Q115 32 115 64 Z" fill="#7c7650" />
        <path d="M45 62 Q80 68 115 62 L115 66 Q80 74 45 66 Z" fill="#4f4b30" />
        <path d="M66 66 Q80 82 102 68" fill="#4f4b30" />
        <circle cx="80" cy="47" r="5" fill="#e2b04a" />
      </g>
    )
  }
  return null
}

function HandItem({ id, x, y }: { id?: string; x: number; y: number }) {
  if (id === 'jeongjo-bow') {
    return (
      <g>
        <path
          d={`M${x + 4} ${y - 54} Q${x + 32} ${y} ${x + 4} ${y + 54}`}
          fill="none"
          stroke="#7a4a26"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path d={`M${x + 4} ${y - 54} L${x + 4} ${y + 54}`} stroke="#efe6cf" strokeWidth="1.5" />
      </g>
    )
  }
  if (id === 'hwarang-sword') {
    return (
      <g transform={`rotate(-20 ${x} ${y})`} stroke={OL} strokeWidth="1.4">
        <path
          d={`M${x - 3.5} ${y - 6} L${x - 3.5} ${y - 60} L${x} ${y - 68} L${x + 3.5} ${y - 60} L${x + 3.5} ${y - 6} Z`}
          fill="#dfe6e9"
        />
        <rect x={x - 11} y={y - 7} width="22" height="5" rx="2" fill="#e2b04a" />
        <rect x={x - 3.5} y={y - 2} width="7" height="15" rx="2" fill="#5a3a26" />
      </g>
    )
  }
  if (id === 'manse-flag') {
    return (
      <g>
        <path d={`M${x} ${y + 8} L${x} ${y - 62}`} stroke="#6b4a2f" strokeWidth="2.6" strokeLinecap="round" />
        <Taegukgi x={x + 1.3} y={y - 62} height={17} />
      </g>
    )
  }
  if (id === 'brush') {
    return (
      <g transform={`rotate(-25 ${x} ${y})`} stroke={OL} strokeWidth="1.2">
        <rect x={x - 2.5} y={y - 46} width="5" height="52" rx="2" fill="#a0703f" />
        <path d={`M${x - 4.5} ${y - 46} Q${x} ${y - 66} ${x + 4.5} ${y - 46} Z`} fill="#1f1f1f" />
      </g>
    )
  }
  return null
}

/**
 * 태극기 (깃대가 왼쪽에 오는 앞면). 가로:세로 = 3:2
 * 태극: 위 빨강, 아래 파랑. 빨강의 둥근 머리는 왼쪽 위(건 쪽), 파랑의 머리는 오른쪽 아래(곤 쪽). 괘: 왼쪽 위 건(☰), 오른쪽 위 감(☵), 왼쪽 아래 리(☲), 오른쪽 아래 곤(☷)
 * 작은 그림에서도 보이도록 괘 막대는 실제 비율보다 조금 굵게 그린다.
 */
function Taegukgi({ x, y, height: h }: { x: number; y: number; height: number }) {
  const w = h * 1.5
  const cx = x + w / 2
  const cy = y + h / 2
  const r = h / 4
  const tilt = (Math.atan2(2, 3) * 180) / Math.PI // 깃면 대각선 기울기
  const bar = h / 4
  const thick = h / 14
  const gap = h / 24
  const dist = r + h / 8 + (3 * thick + 2 * gap) / 2
  // [가로 방향, 세로 방향, 막대 3개(true = 이어진 막대, false = 가운데가 끊긴 막대)]
  const trigrams: [number, number, boolean[]][] = [
    [-1, -1, [true, true, true]], // 건
    [1, -1, [false, true, false]], // 감
    [-1, 1, [true, false, true]], // 리
    [1, 1, [false, false, false]], // 곤
  ]
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fbfaf5" stroke="#b9b2a3" strokeWidth="0.5" />
      <g transform={`rotate(${tilt} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="#0047a0" />
        <path
          d={`M${cx - r} ${cy} A${r / 2} ${r / 2} 0 0 0 ${cx} ${cy} A${r / 2} ${r / 2} 0 0 1 ${cx + r} ${cy} A${r} ${r} 0 0 0 ${cx - r} ${cy} Z`}
          fill="#cd2e3a"
        />
      </g>
      {trigrams.map(([sx, sy, lines]) => {
        const length = Math.hypot(3, 2)
        const tx = cx + ((sx * 3) / length) * dist
        const ty = cy + ((sy * 2) / length) * dist
        const angle = (Math.atan2(sy * 2, sx * 3) * 180) / Math.PI + 90
        return (
          <g key={`${sx}${sy}`} transform={`translate(${tx} ${ty}) rotate(${angle})`} fill="#1f1f1f">
            {lines.map((solid, i) => {
              const by = (i - 1) * (thick + gap) - thick / 2
              return solid ? (
                <rect key={i} x={-bar / 2} y={by} width={bar} height={thick} />
              ) : (
                <g key={i}>
                  <rect x={-bar / 2} y={by} width={bar * 0.44} height={thick} />
                  <rect x={bar * 0.06} y={by} width={bar * 0.44} height={thick} />
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

/** 색을 밝게(+) 또는 어둡게(-) */
function shade(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16)
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  const r = clamp((value >> 16) + amount)
  const g = clamp(((value >> 8) & 0xff) + amount)
  const b = clamp((value & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
