import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Sparkles } from '@react-three/drei'
import Character from './Character'
import Platform from './Platform'
import Space from './Space'
import Cosmos from './Cosmos'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

export const ACCENT = '#d4ff3a'
const { damp } = THREE.MathUtils

// Where the character stands for each section, [x, y, z, scale], so it makes room for the copy.
const POSES = [
  [2.5, 0.3, 0, 1.3],
  [2.7, -0.2, -2, 1.3], // behind the glass detail panel
  [-2.4, -0.05, -0.5, 1.35],
  [0, 0.95, -2.5, 1.15],
]

// Animated mannequin; each section plays its own move (see Character.jsx).
const SECTION_POSES = ['home', 'work', 'history', 'tools']

function Hero({ section }) {
  const group = useRef()

  useFrame(({ pointer, viewport }, dt) => {
    const g = group.current
    const [x, y, z, s] = POSES[section]
    const narrow = viewport.aspect < 1 // phones: park it behind the copy, top centre
    g.position.x = damp(g.position.x, narrow ? 0 : x, 2.5, dt)
    g.position.y = damp(g.position.y, narrow ? 1.1 : y, 2.5, dt)
    g.position.z = damp(g.position.z, narrow ? -2 : z, 2.5, dt)
    g.scale.setScalar(damp(g.scale.x, narrow ? s * 0.8 : s, 2.5, dt))
    g.rotation.y = damp(g.rotation.y, pointer.x * 0.35, 2, dt) // turns slightly toward the cursor
  })

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <Character pose={SECTION_POSES[section]} />
        {/* Holographic pedestal under the feet, like a game's character-select screen. */}
        <Platform />
      </Float>
    </group>
  )
}

export default function Scene({ section }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 40 }}>
      <color attach="background" args={['#03040a']} />
      <ambientLight intensity={0.6} />
      {/* Soft white key so skin reads naturally; the lime and blue lights become rim colour. */}
      <directionalLight position={[1.5, 2.5, 5]} intensity={2.6} />
      <pointLight position={[-3, 2, -1]} intensity={30} color={ACCENT} />
      <pointLight position={[4, -1, -1]} intensity={20} color="#7aa2ff" />
      <Suspense fallback={null}>
        <Hero section={section} />
      </Suspense>
      <Cosmos section={section} />
      <Space section={section} />
      <Sparkles count={70} scale={[14, 8, 6]} size={2} speed={0.25} opacity={0.5} color={ACCENT} />
      <Environment preset="city" environmentIntensity={0.6} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
