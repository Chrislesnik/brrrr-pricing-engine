"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { createNoise3D } from "simplex-noise"

interface VoiceOrbProps {
  volumeLevel: number
  isSessionActive: boolean
  isSpeaking?: boolean
  onClick?: () => void
  size?: number
}

const noise = createNoise3D()

export function VoiceOrb({ volumeLevel, isSessionActive, isSpeaking = false, onClick, size = 300 }: VoiceOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const ballRef = useRef<THREE.Mesh | null>(null)
  const originalPositionsRef = useRef<Float32Array | null>(null)
  const frameRef = useRef<number>(0)
  const volumeRef = useRef(0)
  const activeRef = useRef(false)
  const speakingRef = useRef(false)

  volumeRef.current = volumeLevel
  activeRef.current = isSessionActive
  speakingRef.current = isSpeaking

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const group = new THREE.Group()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 100)
    camera.position.set(0, 0, 100)
    camera.lookAt(scene.position)
    scene.add(camera)

    sceneRef.current = scene
    groupRef.current = group
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    const geometry = new THREE.IcosahedronGeometry(10, 8)
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      wireframe: true,
    })

    const ball = new THREE.Mesh(geometry, material)
    ball.position.set(0, 0, 0)
    ballRef.current = ball
    originalPositionsRef.current = new Float32Array(ball.geometry.attributes.position.array)

    group.add(ball)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff)
    spotLight.intensity = 0.9
    spotLight.position.set(-10, 40, 20)
    spotLight.lookAt(ball.position)
    spotLight.castShadow = true
    scene.add(spotLight)

    scene.add(group)

    container.innerHTML = ""
    container.appendChild(renderer.domElement)

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)

      if (!groupRef.current || !ballRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current) {
        return
      }

      groupRef.current.rotation.y += 0.005

      if (activeRef.current) {
        const vol = volumeRef.current
        const speaking = speakingRef.current
        const isWaiting = vol < 0.05 && !speaking

        if (isWaiting) {
          pulseBall(ballRef.current, originalPositionsRef.current!)
        } else {
          morphBall(ballRef.current, vol)
        }
      } else if (originalPositionsRef.current) {
        resetBall(ballRef.current, originalPositionsRef.current)
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [size])

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.()
      }}
      className="cursor-pointer select-none"
      style={{ width: size, height: size }}
    />
  )
}

function morphBall(mesh: THREE.Mesh, volume: number) {
  const geometry = mesh.geometry as THREE.BufferGeometry
  const positionAttr = geometry.getAttribute("position")

  for (let i = 0; i < positionAttr.count; i++) {
    const vertex = new THREE.Vector3(
      positionAttr.getX(i),
      positionAttr.getY(i),
      positionAttr.getZ(i),
    )

    const offset = 10
    const amp = 2.5
    const time = performance.now()
    vertex.normalize()
    const rf = 0.00001
    const distance =
      offset +
      volume * 4 +
      noise(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * volume

    vertex.multiplyScalar(distance)
    positionAttr.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  positionAttr.needsUpdate = true
  geometry.computeVertexNormals()
}

/** Slow breathing pulse when waiting for a response */
function pulseBall(mesh: THREE.Mesh, originalPositions: Float32Array) {
  const geometry = mesh.geometry as THREE.BufferGeometry
  const positionAttr = geometry.getAttribute("position")
  const time = performance.now() * 0.001

  // Smooth sine wave: scale oscillates between 0.92 and 1.12
  const scale = 1.0 + 0.1 * Math.sin(time * 1.8)
  // Gentle noise distortion layered on top
  const noiseAmp = 0.15 + 0.1 * Math.sin(time * 1.2)

  for (let i = 0; i < positionAttr.count; i++) {
    const ox = originalPositions[i * 3]
    const oy = originalPositions[i * 3 + 1]
    const oz = originalPositions[i * 3 + 2]

    const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
    const nx = ox / len
    const ny = oy / len
    const nz = oz / len

    const noiseVal = noise(
      nx + time * 0.6,
      ny + time * 0.7,
      nz + time * 0.8,
    )

    const dist = len * scale + noiseVal * noiseAmp * len
    positionAttr.setXYZ(i, nx * dist, ny * dist, nz * dist)
  }

  positionAttr.needsUpdate = true
  geometry.computeVertexNormals()
}

function resetBall(mesh: THREE.Mesh, originalPositions: Float32Array) {
  const geometry = mesh.geometry as THREE.BufferGeometry
  const positionAttr = geometry.getAttribute("position")
  const current = positionAttr.array as Float32Array

  let needsUpdate = false
  for (let i = 0; i < current.length; i++) {
    const diff = originalPositions[i] - current[i]
    if (Math.abs(diff) > 0.01) {
      current[i] += diff * 0.1
      needsUpdate = true
    } else if (current[i] !== originalPositions[i]) {
      current[i] = originalPositions[i]
      needsUpdate = true
    }
  }

  if (needsUpdate) {
    positionAttr.needsUpdate = true
    geometry.computeVertexNormals()
  }
}
