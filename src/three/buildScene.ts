import * as THREE from 'three'

// 장소별 3D 배경을 코드로 만드는 함수 모음 (로우폴리 스타일)
// 외부 모델 파일 없이 기본 도형을 조합해서 만들기 때문에 인터넷 연결 없이도 보인다.

export type SceneKind = 'palace' | 'fortress' | 'memorial' | 'market' | 'temple' | 'sea' | 'hall'

export type SceneTheme = {
  kind: SceneKind
  skyTop: string
  skyBottom: string
  ground: string
  /** 카메라가 도는 반지름과 높이 */
  orbit: { radius: number; height: number; target: [number, number, number] }
}

export const sceneThemes: Record<string, SceneTheme> = {
  gyeongbokgung: {
    kind: 'palace',
    skyTop: '#7fb2d9',
    skyBottom: '#f6e3c4',
    ground: '#d9cdb2',
    orbit: { radius: 26, height: 9, target: [0, 3, 0] },
  },
  suwon: {
    kind: 'fortress',
    skyTop: '#8cc0e0',
    skyBottom: '#f5e7c9',
    ground: '#a8b98a',
    orbit: { radius: 26, height: 10, target: [0, 3, 0] },
  },
  independence: {
    kind: 'memorial',
    skyTop: '#9fb9d6',
    skyBottom: '#eef0ea',
    ground: '#bfc4b4',
    orbit: { radius: 30, height: 10, target: [0, 4, 0] },
  },
  aunae: {
    kind: 'market',
    skyTop: '#8fb8d8',
    skyBottom: '#f4e6c8',
    ground: '#cbb48c',
    orbit: { radius: 24, height: 8, target: [0, 2, 0] },
  },
  bulguksa: {
    kind: 'temple',
    skyTop: '#e9a76c',
    skyBottom: '#f7dfb8',
    ground: '#c9b48e',
    orbit: { radius: 24, height: 9, target: [0, 3, 0] },
  },
  hansando: {
    kind: 'sea',
    skyTop: '#5f8fb8',
    skyBottom: '#e8d7b6',
    ground: '#2f6f8f',
    orbit: { radius: 30, height: 9, target: [0, 1, 0] },
  },
  hunminjeongeum: {
    kind: 'hall',
    skyTop: '#a7c4dc',
    skyBottom: '#f3ead6',
    ground: '#cdbf9f',
    orbit: { radius: 22, height: 8, target: [0, 3, 0] },
  },
}

const mat = (color: string, extra: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra })

function box(w: number, h: number, d: number, color: string) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color))
}

/** 한옥 건물: 기단 + 기둥 + 단청 보 + 기와지붕(한 층 또는 두 층) */
function hanok(width: number, depth: number, height: number, floors = 1) {
  const group = new THREE.Group()
  const base = box(width + 2, 0.8, depth + 2, '#bdb5a3')
  base.position.y = 0.4
  group.add(base)
  const pillarGeo = new THREE.CylinderGeometry(0.22, 0.25, height, 8)
  const cols = Math.max(2, Math.round(width / 2.2))
  for (let i = 0; i <= cols; i += 1) {
    for (const z of [-depth / 2, depth / 2]) {
      const pillar = new THREE.Mesh(pillarGeo, mat('#9c3b2f'))
      pillar.position.set(-width / 2 + (width / cols) * i, 0.8 + height / 2, z)
      group.add(pillar)
    }
  }
  const wall = box(width - 0.3, height * 0.75, depth - 0.3, '#efe4cc')
  wall.position.y = 0.8 + height * 0.4
  group.add(wall)
  let y = 0.8 + height
  for (let floor = 0; floor < floors; floor += 1) {
    const scale = 1 - floor * 0.28
    const beam = box(width * scale + 0.6, 0.5, depth * scale + 0.6, '#3f7a5c')
    beam.position.y = y + 0.25
    group.add(beam)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4, 1), mat('#3c4148'))
    roof.rotation.y = Math.PI / 4
    roof.scale.set((width * scale + 3.4) * 0.72, 2.2 * scale + 0.6, (depth * scale + 3.4) * 0.72)
    roof.position.y = y + 0.5 + roof.scale.y / 2
    group.add(roof)
    const ridge = box(width * scale * 0.55, 0.3, 0.35, '#2b2f35')
    ridge.position.y = roof.position.y + roof.scale.y / 2 - 0.1
    group.add(ridge)
    y = roof.position.y + 0.4
    if (floor < floors - 1) {
      const upper = box(width * 0.7, 1.4, depth * 0.7, '#efe4cc')
      upper.position.y = y + 0.3
      group.add(upper)
      y += 1.2
    }
  }
  return group
}

function tree(x: number, z: number, scale = 1, color = '#5f8f4e') {
  const group = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.4, 6), mat('#6b4a2f'))
  trunk.position.y = 0.7
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mat(color))
  leaves.position.y = 2
  group.add(trunk, leaves)
  group.position.set(x, 0, z)
  group.scale.setScalar(scale)
  return group
}

function mountains(color = '#7d9a6a') {
  const group = new THREE.Group()
  const spots: [number, number, number, number][] = [
    [-30, -38, 14, 11],
    [-10, -44, 18, 14],
    [14, -40, 15, 10],
    [34, -34, 12, 9],
  ]
  for (const [x, z, h, r] of spots) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat(color))
    mountain.position.set(x, h / 2 - 0.5, z)
    group.add(mountain)
  }
  return group
}

/** 성벽: 몸체 + 여장(凸 모양) */
function wall(length: number) {
  const group = new THREE.Group()
  const body = box(length, 3, 1.4, '#b9ad94')
  body.position.y = 1.5
  group.add(body)
  for (let x = -length / 2 + 0.6; x < length / 2; x += 1.6) {
    const merlon = box(0.9, 0.8, 1.4, '#a99c82')
    merlon.position.set(x, 3.4, 0)
    group.add(merlon)
  }
  return group
}

/** 석탑: 층마다 몸돌 + 지붕돌 */
function stonePagoda(levels: number, base = 2.4) {
  const group = new THREE.Group()
  let y = 0
  const plinth = box(base + 1, 1, base + 1, '#cbc3b2')
  plinth.position.y = 0.5
  group.add(plinth)
  y = 1
  for (let i = 0; i < levels; i += 1) {
    const s = base * (1 - i * 0.18)
    const bodyStone = box(s * 0.7, 1.1, s * 0.7, '#d8d1c1')
    bodyStone.position.y = y + 0.55
    const roofStone = box(s, 0.35, s, '#bfb7a5')
    roofStone.position.y = y + 1.28
    group.add(bodyStone, roofStone)
    y += 1.45
  }
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6), mat('#a39b8a'))
  finial.position.y = y + 0.8
  group.add(finial)
  return group
}

/** 다보탑: 사각 기단 + 난간 + 팔각 몸돌 */
function daboPagoda() {
  const group = new THREE.Group()
  const base = box(3.6, 1.6, 3.6, '#d8d1c1')
  base.position.y = 0.8
  const roof = box(4.2, 0.35, 4.2, '#bfb7a5')
  roof.position.y = 1.8
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.9, 8, 1, true),
    mat('#cfc7b6', { side: THREE.DoubleSide }),
  )
  rail.position.y = 2.4
  const octa = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.4, 8), mat('#d8d1c1'))
  octa.position.y = 3.4
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 8), mat('#bfb7a5'))
  top.position.y = 4.2
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 1.6, 6), mat('#a39b8a'))
  finial.position.y = 5.1
  group.add(base, roof, rail, octa, top, finial)
  return group
}

/** 판옥선 느낌의 배 */
function ship(color: string, sailColor: string) {
  const group = new THREE.Group()
  const hull = box(5, 1.2, 1.8, color)
  hull.position.y = 0.4
  const deck = box(3.6, 0.9, 1.6, '#7a5236')
  deck.position.y = 1.4
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 6), mat('#5a3a26'))
  mast.position.y = 3.6
  const sail = box(0.08, 2.6, 2.2, sailColor)
  sail.position.set(0.15, 3.8, 0)
  sail.rotation.y = Math.PI / 2
  group.add(hull, deck, mast, sail)
  return group
}

/** 장면을 만들고, 매 프레임 호출할 애니메이션 함수를 돌려준다 */
export function buildScene(scene: THREE.Scene, theme: SceneTheme): (time: number) => void {
  const groundMat = mat(theme.ground)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 32), groundMat)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const animated: ((t: number) => void)[] = []

  if (theme.kind === 'palace') {
    scene.add(mountains())
    const terrace = box(16, 1, 12, '#c9c0ac')
    terrace.position.set(0, 0.5, -2)
    scene.add(terrace)
    const hall = hanok(10, 6, 3.2, 2)
    hall.position.set(0, 1, -2)
    scene.add(hall)
    for (const x of [-15, 15]) {
      const corridor = hanok(2.2, 16, 2.2)
      corridor.position.set(x, 0, 2)
      scene.add(corridor)
    }
    for (let i = 0; i < 6; i += 1) {
      const stone = box(0.4, 0.8, 0.3, '#a8a08c')
      stone.position.set(-3 + (i % 2) * 6, 0.4, 6 + Math.floor(i / 2) * 2.5)
      scene.add(stone)
    }
  }

  if (theme.kind === 'fortress') {
    scene.add(mountains('#86a573'))
    const left = wall(18)
    left.position.set(-12, 0, -4)
    left.rotation.y = 0.25
    const right = wall(18)
    right.position.set(12, 0, -4)
    right.rotation.y = -0.25
    scene.add(left, right)
    const gateBase = box(7, 4, 3, '#b0a48a')
    gateBase.position.set(0, 2, -6)
    const arch = box(2.4, 2.6, 3.2, '#3a352d')
    arch.position.set(0, 1.3, -6)
    const tower = hanok(5, 2.6, 2, 2)
    tower.position.set(0, 3.2, -6)
    scene.add(gateBase, arch, tower)
    for (let i = 0; i < 8; i += 1) scene.add(tree(-20 + i * 5.5, 8 + (i % 2) * 3, 0.9))
  }

  if (theme.kind === 'memorial') {
    scene.add(mountains('#8aa07c'))
    const plaza = box(26, 0.4, 18, '#d6d3c8')
    plaza.position.y = 0.2
    scene.add(plaza)
    const hall = new THREE.Group()
    const body = box(14, 5, 8, '#e6e0d2')
    body.position.y = 2.9
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), mat('#4a4f57'))
    roof.rotation.y = Math.PI / 4
    roof.scale.set(13, 5, 8.5)
    roof.position.y = 7.9
    hall.add(body, roof)
    hall.position.set(0, 0, -6)
    scene.add(hall)
    for (let i = 0; i < 7; i += 1) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 6), mat('#d9d9d9'))
      pole.position.set(-9 + i * 3, 3.5, 6)
      const flag = box(1.6, 1, 0.05, i % 2 ? '#ffffff' : '#f4f4f4')
      flag.position.set(-8.2 + i * 3, 6.4, 6)
      scene.add(pole, flag)
      animated.push((t) => {
        flag.rotation.y = Math.sin(t * 2 + i) * 0.25
      })
    }
    for (let i = 0; i < 6; i += 1) scene.add(tree(-16 + i * 6.4, -14, 1.2, '#5b8a54'))
  }

  if (theme.kind === 'market') {
    // 장날의 장터 거리: 가운데 길 양옆으로 집과 천막 가게, 흔들리는 흰 깃발
    scene.add(mountains('#8fa57a'))
    const road = box(6, 0.1, 40, '#bfa77d')
    road.position.y = 0.05
    scene.add(road)
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const house = hanok(4, 3, 2)
        house.position.set(side * 10, 0, -10 + i * 7)
        house.rotation.y = side * (Math.PI / 2)
        scene.add(house)
      }
      for (let i = 0; i < 4; i += 1) {
        const stall = new THREE.Group()
        const table = box(2.4, 1, 1.4, '#8a6240')
        table.position.y = 0.5
        const goods = box(2, 0.4, 1, ['#d9a441', '#9cbf5f', '#c8553d', '#e8d9b5'][i])
        goods.position.y = 1.2
        const awning = box(3, 0.15, 2.2, i % 2 ? '#efe6d2' : '#d8cdb3')
        awning.position.y = 2.6
        awning.rotation.z = side * 0.18
        stall.add(table, goods, awning)
        for (const x of [-1.3, 1.3]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), mat('#6b4a2f'))
          post.position.set(x, 1.3, 0.9)
          stall.add(post)
        }
        stall.position.set(side * 5, 0, -9 + i * 5.5)
        stall.rotation.y = side * (Math.PI / 2)
        scene.add(stall)
      }
    }
    for (let i = 0; i < 6; i += 1) {
      const x = -6 + (i % 2) * 12
      const z = -8 + Math.floor(i / 2) * 7
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), mat('#7a5a3a'))
      pole.position.set(x, 2, z)
      const flag = box(1.2, 0.8, 0.04, '#fbfaf5')
      flag.position.set(x + 0.6, 3.5, z)
      scene.add(pole, flag)
      animated.push((t) => {
        flag.rotation.y = Math.sin(t * 2.2 + i) * 0.3
      })
    }
    for (let i = 0; i < 4; i += 1) scene.add(tree(-18 + i * 12, -16, 1.1))
  }

  if (theme.kind === 'temple') {
    scene.add(mountains('#9a8d5f'))
    const terrace = box(18, 2.4, 10, '#c8bea7')
    terrace.position.set(0, 1.2, -4)
    scene.add(terrace)
    for (let i = 0; i < 6; i += 1) {
      const step = box(4, 0.4, 0.8, '#bfb49c')
      step.position.set(0, 0.2 + i * 0.4, 1.8 - i * 0.8)
      scene.add(step)
    }
    const hall = hanok(8, 5, 2.8)
    hall.position.set(0, 2.4, -6)
    scene.add(hall)
    const seokga = stonePagoda(3)
    seokga.position.set(-5, 2.4, -1.5)
    seokga.scale.setScalar(0.75)
    const dabo = daboPagoda()
    dabo.position.set(5, 2.4, -1.5)
    dabo.scale.setScalar(0.75)
    scene.add(seokga, dabo)
    for (let i = 0; i < 6; i += 1) scene.add(tree(-18 + i * 7, 9, 1, i % 2 ? '#c46b3c' : '#d99a3e'))
  }

  if (theme.kind === 'sea') {
    groundMat.color.set('#2f6f8f')
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160, 40, 40),
      mat('#3b84a8', { transparent: true, opacity: 0.92 }),
    )
    water.rotation.x = -Math.PI / 2
    water.position.y = 0.2
    scene.add(water)
    const position = water.geometry.attributes.position as THREE.BufferAttribute
    const baseZ = Array.from({ length: position.count }, (_, i) => position.getZ(i))
    animated.push((t) => {
      for (let i = 0; i < position.count; i += 1) {
        position.setZ(
          i,
          baseZ[i] + Math.sin(t * 1.4 + position.getX(i) * 0.3 + position.getY(i) * 0.2) * 0.25,
        )
      }
      position.needsUpdate = true
    })
    for (const [x, z, r, h] of [
      [-22, -26, 8, 6],
      [18, -30, 10, 8],
      [30, 4, 6, 4],
    ] as const) {
      const island = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat('#6f8f5a'))
      island.position.set(x, h / 2 - 0.5, z)
      scene.add(island)
    }
    const ships: THREE.Group[] = []
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (i - 2) * 0.45
      const s = ship(i === 2 ? '#5a2e22' : '#6b4630', '#efe2c4')
      s.position.set(Math.cos(angle) * 9, 0, Math.sin(angle) * 9 + 4)
      s.rotation.y = -angle
      scene.add(s)
      ships.push(s)
    }
    for (let i = 0; i < 3; i += 1) {
      const enemy = ship('#3b3b3b', '#b9b0a0')
      enemy.position.set(-4 + i * 4, 0, -10)
      scene.add(enemy)
      ships.push(enemy)
    }
    animated.push((t) => ships.forEach((s, i) => (s.position.y = Math.sin(t * 1.6 + i) * 0.18)))
  }

  if (theme.kind === 'hall') {
    scene.add(mountains('#88a27a'))
    const yard = box(16, 0.3, 12, '#d8cfb8')
    yard.position.y = 0.15
    scene.add(yard)
    const hall = hanok(9, 5, 2.8)
    hall.position.set(0, 0.3, -4)
    scene.add(hall)
    // 바닥에 펼쳐진 한지와 글자 판
    for (let i = 0; i < 4; i += 1) {
      const paper = box(1.6, 0.05, 2.2, '#f8f1dc')
      paper.position.set(-3 + i * 2, 0.35, 3)
      scene.add(paper)
      const ink = box(0.9, 0.06, 0.12, '#222')
      ink.position.set(-3 + i * 2, 0.4, 2.6)
      scene.add(ink)
    }
    for (let i = 0; i < 5; i += 1) scene.add(tree(-16 + i * 8, -12, 1.1))
  }

  return (time: number) => animated.forEach((fn) => fn(time))
}
