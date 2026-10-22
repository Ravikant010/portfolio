import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Sparkles, useGLTF } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

export const ACCENT = '#d4ff3a'
const { damp } = THREE.MathUtils

// Where the character stands for each section, [x, y, z, scale], so it makes room for the copy.
const POSES = [
  [2.5, 0.35, 0, 1.3],
  [2.7, -0.2, -2, 1.3], // behind the glass detail panel
  [-2.4, -0.05, -0.5, 1.35],
  [0, 0.95, -2.5, 1.15],
]

// Game-style character of me, one pose per section (Hyper3D Rodin from my face card, cleaned in Blender).
const MODELS = ['home', 'work', 'history', 'tools'].map((k) => `/models/pose_${k}.glb`)
MODELS.forEach((url) => useGLTF.preload(url))

function Character({ index }) {
  const { scene } = useGLTF(MODELS[index])
  // Rodin's roughness map reads as wet plastic under the city HDR; force a soft matte finish.
  useLayoutEffect(() => scene.traverse((o) => {
    if (!o.isMesh) return
    o.material.metalness = 0
    o.material.metalnessMap = null
    o.material.roughness = 0.85
    o.material.roughnessMap = null
    o.material.envMapIntensity = 0.35
    o.material.needsUpdate = true
  }), [scene])
  return <primitive object={scene} />
}

const TAU = Math.PI * 2

function Hero({ section }) {
  const group = useRef()
  const spin = useRef()
  const ring = useRef()
  const [shown, setShown] = useState(section)
  const phase = useRef('idle') // idle -> out (spin + shrink) -> swap pose -> in (spin + grow)

  useFrame(({ pointer, viewport }, dt) => {
    const g = group.current
    const [x, y, z, s] = POSES[section]
    const narrow = viewport.aspect < 1 // phones: park it behind the copy, top centre
    g.position.x = damp(g.position.x, narrow ? 0 : x, 2.5, dt)
    g.position.y = damp(g.position.y, narrow ? 1.1 : y, 2.5, dt)
    g.position.z = damp(g.position.z, narrow ? -2 : z, 2.5, dt)
    g.scale.setScalar(damp(g.scale.x, narrow ? s * 0.8 : s, 2.5, dt))
    g.rotation.y = damp(g.rotation.y, pointer.x * 0.5, 2, dt) // turns to follow the cursor
    ring.current.rotation.z -= dt * 0.6

    const sp = spin.current
    if (phase.current === 'idle' && shown !== section) phase.current = 'out'
    if (phase.current === 'out') {
      sp.rotation.y += dt * 16
      sp.scale.setScalar(Math.max(0.02, sp.scale.x - dt * 4))
      if (sp.scale.x <= 0.02) {
        setShown(section)
        phase.current = 'in'
      }
    } else if (phase.current === 'in') {
      sp.rotation.y += dt * 16 * (1.2 - sp.scale.x)
      sp.scale.setScalar(Math.min(1, sp.scale.x + dt * 3.5))
      if (sp.scale.x >= 1) phase.current = 'idle'
    } else {
      // Settle the spin back to facing front.
      sp.rotation.y = damp(sp.rotation.y, Math.round(sp.rotation.y / TAU) * TAU, 6, dt)
    }
  })

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <group ref={spin}>
          <Character index={shown} />
        </group>
        {/* Glowing platform under the feet, like a game's character-select screen. */}
        <mesh ref={ring} position={[0, -0.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.01, 16, 160]} />
          {/* Pushed past 1 so only this ring blooms. */}
          <meshBasicMaterial color={[0.83 * 4, 1 * 4, 0.23 * 4]} toneMapped={false} />
        </mesh>
      </Float>
    </group>
  )
}

export default function Scene({ section }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 40 }}>
      <color attach="background" args={['#0a0b0d']} />
      <ambientLight intensity={0.6} />
      {/* Soft white key so skin reads naturally; the lime and blue lights become rim colour. */}
      <directionalLight position={[1.5, 2.5, 5]} intensity={2.6} />
      <pointLight position={[-3, 2, -1]} intensity={30} color={ACCENT} />
      <pointLight position={[4, -1, -1]} intensity={20} color="#7aa2ff" />
      <Suspense fallback={null}>
        <Hero section={section} />
      </Suspense>
      <Sparkles count={70} scale={[14, 8, 6]} size={2} speed={0.25} opacity={0.5} color={ACCENT} />
      <Environment preset="city" environmentIntensity={0.6} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
