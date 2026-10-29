import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { fadeMaterial } from './Platform'

// "Roadster in orbit" backdrop: starfield, a sun, and the Roadster.
const SUN = new THREE.Vector3(1, 0.35, 0.25).normalize()

// Tesla Roadster 2020 by vecarz (CC BY 4.0), decimated to ~200k tris in Blender.
const ROADSTER = '/models/roadster.glb'
useGLTF.preload(ROADSTER)

// Empty patch of sky per section, [x, y] at z = -8, so the car never covers the copy.
const SPOTS = [
  [-0.6, 2.4],
  [-3, 3.7],
  [-2, 2.3],
  [4.6, 2.4],
]
const { damp } = THREE.MathUtils

// Sci-fi finish: gunmetal body with a lime Fresnel edge and a light band sweeping nose to tail.
function holoPaint(time) {
  const m = new THREE.MeshStandardMaterial({ color: '#0b0c10', metalness: 0.9, roughness: 0.25 })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time
    shader.vertexShader = 'varying vec3 vObj;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;')
    shader.fragmentShader = 'uniform float uTime; varying vec3 vObj;\n' + shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 6.0);
      float band = 1.0 - smoothstep(0.0, 0.03, abs(fract(vObj.z * 0.25 - uTime * 0.35) - 0.5));
      totalEmissiveRadiance += vec3(0.83, 1.0, 0.23) * (fres * 1.8 + band * 2.0);`,
    )
  }
  return m
}
// Lights pushed past 1 so Bloom flares them.
const LIGHTS = {
  'headlights main': [6, 6, 6], 'headlights AHO': [8, 8, 8],
  'Glass rear lights main': [8, 0.1, 0.1], 'Glass rear lights DHO': [8, 0.1, 0.1],
  calipers: [3, 3.6, 0.8],
}

// Glides to its section's spot, then drifts and tumbles slowly, like the real one in orbit.
function Roadster({ section }) {
  const car = useRef()
  const trail = useRef()
  const time = useRef({ value: 0 })
  const { scene } = useGLTF(ROADSTER)
  const glowFloor = useMemo(() => fadeMaterial('radial', 0.7), [])
  const thrust = useMemo(() => fadeMaterial('height', 0.7), [])
  // The model's origin is at the front bumper; recentre so it tumbles around its middle.
  // Measured in the model's own space: after a remount the cached scene is still parented and moved.
  const centre = useMemo(() => {
    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene).applyMatrix4(scene.matrixWorld.clone().invert())
    return box.getCenter(new THREE.Vector3()).negate()
  }, [scene])

  useLayoutEffect(() => {
    const paint = holoPaint(time.current)
    scene.traverse((o) => {
      if (!o.isMesh) return
      const name = o.material.name
      if (name === 'car main paint') o.material = paint
      else if (LIGHTS[name]) {
        o.material.emissive.setRGB(...LIGHTS[name])
        o.material.emissiveIntensity = 1
        o.material.toneMapped = false
      }
    })
  }, [scene])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    time.current.value = t
    const c = car.current
    const [x, y] = SPOTS[section]
    c.position.x = damp(c.position.x, x + Math.sin(t * 0.08) * 0.3, 1.5, dt)
    c.position.y = damp(c.position.y, y + Math.sin(t * 0.13) * 0.2, 1.5, dt)
    c.position.z = -8
    c.rotation.set(0.35 + Math.sin(t * 0.1) * 0.15, t * 0.12, 0.25 + Math.cos(t * 0.09) * 0.1)
    trail.current.scale.y = 1 + Math.sin(t * 23) * 0.08 + Math.sin(t * 7) * 0.1 // engine flicker
  })

  return (
    <group ref={car} scale={0.5} position={[SPOTS[0][0], SPOTS[0][1], -8]}>
      <primitive object={scene} position={centre} />
      {/* lime under-glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} scale={[2.6, 5.2, 1]} material={glowFloor}>
        <planeGeometry />
      </mesh>
      {/* thruster trail out of the tail (the tail is -z) */}
      <group ref={trail} position={[0, 0.1, -2.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 1.6, 0]} material={thrust}>
          <cylinderGeometry args={[0.08, 0.32, 3.2, 32, 1, true]} />
        </mesh>
      </group>
    </group>
  )
}

export default function Space({ section }) {
  return (
    <>
      <Stars radius={90} depth={40} count={5000} factor={4} saturation={0} fade speed={0.4} />
      <Suspense fallback={null}>
        <Roadster section={section} />
      </Suspense>
      {/* sun: pushed past 1 so Bloom turns it into a flare */}
      <mesh position={SUN.clone().multiplyScalar(60)}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color={[12, 10, 8]} toneMapped={false} />
      </mesh>
    </>
  )
}
