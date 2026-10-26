// 태극기 깃면 그림 (국기 규격: 가로:세로 = 3:2, 국가기록원 '국기의 제작' 작도법)
// 아바타 SVG(Avatar.tsx)와 손에 드는 태극기 아이템(ItemArtView)이 함께 쓴다.

/**
 * 태극기 (깃대가 왼쪽에 오는 앞면). 가로:세로 = 3:2
 * 태극: 위 빨강, 아래 파랑. 빨강의 둥근 머리는 왼쪽 위(건 쪽), 파랑의 머리는 오른쪽 아래(곤 쪽). 괘: 왼쪽 위 건(☰), 오른쪽 위 감(☵), 왼쪽 아래 리(☲), 오른쪽 아래 곤(☷)
 * 작은 그림에서도 보이도록 괘 막대는 실제 비율보다 조금 굵게 그린다.
 */
export function Taegukgi({ x, y, height: h }: { x: number; y: number; height: number }) {
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
