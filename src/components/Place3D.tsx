import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildScene, sceneThemes } from '../three/buildScene'

// 학습 화면 맨 위 배너의 장소별 3D 배경 (three.js). 카메라가 천천히 돌며 장소를 보여준다.
// WebGL을 쓸 수 없는 환경에서는 그라데이션 배경만 보인다.
// (학습 영상 장면은 3D 대신 배경 그림을 쓴다 → HistoryScene)
const SPEED = 0.06

export function Place3D({ placeId, className = '' }: { placeId: string; className?: string }) {
  const holder = useRef<HTMLDivElement>(null)
  const theme = sceneThemes[placeId] ?? sceneThemes.gyeongbokgung

  useEffect(() => {
    const element = holder.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(theme.skyBottom, 40, 95)
    scene.add(new THREE.HemisphereLight(theme.skyTop, theme.ground, 1.6))
    const sun = new THREE.DirectionalLight('#fff4dc', 1.8)
    sun.position.set(18, 30, 12)
    scene.add(sun)
    const animate = buildScene(scene, theme)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300)
    const target = new THREE.Vector3(...theme.orbit.target)

    function resize() {
      if (!element) return
      const { clientWidth: width, clientHeight: height } = element
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const start = performance.now()
    function loop(now: number) {
      const t = (now - start) / 1000
      const angle = 0.6 + (reduceMotion ? 0 : Math.sin(t * SPEED) * 0.55)
      camera.position.set(
        Math.sin(angle) * theme.orbit.radius,
        theme.orbit.height,
        Math.cos(angle) * theme.orbit.radius,
      )
      camera.lookAt(target)
      if (!reduceMotion) animate(t)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          ;(Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => m.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [placeId, theme])

  return (
    <div
      ref={holder}
      className={`place-3d ${className}`}
      style={{ background: `linear-gradient(${theme.skyTop}, ${theme.skyBottom})` }}
      aria-hidden="true"
    />
  )
}
