import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fadeMaterial } from './Platform'

// Deep-space set dressing behind the hero: galaxies, nebulae, comets.
// Everything sits far back (z <= -14) and toward the edges so the copy stays readable.

// Seeded random so the layout is the same on every load.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOISE = `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`
const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }

/* ---------- spiral galaxy (particles) ---------- */
function Galaxy({ position, rotation, radius = 12, count = 14000, branches = 4, inside, outside, seed, speed = 0.02 }) {
  const ref = useRef()
  const geometry = useMemo(() => {
    const r = rng(seed)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const cin = new THREE.Color(inside)
    const cout = new THREE.Color(outside)
    for (let i = 0; i < count; i++) {
      const d = Math.pow(r(), 1.6) * radius
      const arm = ((i % branches) / branches) * Math.PI * 2
      const angle = arm + d * 0.35
      // scatter shrinks toward the core so the arms read clearly
      const spread = () => Math.pow(r(), 3) * (r() < 0.5 ? 1 : -1) * (0.3 + d * 0.18)
      pos[i * 3] = Math.cos(angle) * d + spread()
      pos[i * 3 + 1] = spread() * 0.35
      pos[i * 3 + 2] = Math.sin(angle) * d + spread()
      const c = cin.clone().lerp(cout, d / radius)
      col.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [count, branches, radius, inside, outside, seed])

  useFrame((_, dt) => (ref.current.rotation.y += dt * speed))

  return (
    <group position={position} rotation={rotation}>
      <points ref={ref} geometry={geometry}>
        <pointsMaterial size={0.16} sizeAttenuation vertexColors opacity={0.7} {...additive} />
      </points>
      {/* bright core */}
      <mesh>
        <sphereGeometry args={[radius * 0.06, 16, 16]} />
        <meshBasicMaterial color={new THREE.Color(inside).multiplyScalar(4)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- nebula cloud (billboard with fbm) ---------- */
function Nebula({ position, scale, colorA, colorB, seed }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...additive,
        uniforms: { uA: { value: new THREE.Color(colorA) }, uB: { value: new THREE.Color(colorB) }, uSeed: { value: seed }, uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform float uSeed; uniform float uTime; varying vec2 vUv;
          ${NOISE}
          void main() {
            vec2 p = vUv - 0.5;
            float n = fbm(vec3(p * 3.0, uSeed + uTime * 0.01));
            float wisps = fbm(vec3(p * 7.0 + n, uSeed * 2.0));
            float mask = smoothstep(0.5, 0.0, length(p)) * smoothstep(0.35, 0.8, n);
            vec3 c = mix(uA, uB, wisps) * mask * 0.8;
            gl_FragColor = vec4(c, mask);
          }`,
      }),
    [colorA, colorB, seed],
  )
  const ref = useRef()
  useFrame(({ clock }) => (ref.current.material.uniforms.uTime.value = clock.elapsedTime))
  return (
    <mesh ref={ref} position={position} scale={scale} material={mat}>
      <planeGeometry />
    </mesh>
  )
}

/* ---------- comets ---------- */
// White-blue, not lime, so they never read as part of the car's thruster.
const COMET = new THREE.Color(0.75, 0.9, 1)

function Comets({ count = 3 }) {
  const refs = useRef([])
  const mat = useMemo(() => fadeMaterial('height', 2.5, COMET), [])
  const paths = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: count }, () => ({
      start: new THREE.Vector3((r() - 0.5) * 60, 15 + r() * 15, -30 - r() * 30),
      dir: new THREE.Vector3(-0.6 - r() * 0.6, -0.5 - r() * 0.3, 0).normalize(),
      period: 6 + r() * 10,
      offset: r() * 20,
    }))
  }, [count])

  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const { start, dir, period, offset } = paths[i]
      const k = ((clock.elapsedTime + offset) % period) / period
      // only visible for the first quarter of each cycle, then waits off-screen
      m.visible = k < 0.25
      m.position.copy(start).addScaledVector(dir, k * 4 * 70)
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir) // tail trails behind the head
    })
  })

  return paths.map((_, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      {/* tail runs back from the head */}
      <mesh position={[0, 3, 0]} material={mat}>
        <cylinderGeometry args={[0.0, 0.06, 6, 8, 1, true]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={COMET.clone().multiplyScalar(6)} toneMapped={false} />
      </mesh>
    </group>
  ))
}

// One zone of space per section, laid out side by side; the world slides between them on section change,
// so scrolling feels like flying from one place to the next.
const ZONE_GAP = 220
const { damp } = THREE.MathUtils

function World({ section, children }) {
  const world = useRef()
  useFrame(({ pointer }, dt) => {
    const w = world.current
    w.position.x = damp(w.position.x, -section * ZONE_GAP - pointer.x * 1.5, 1.1, dt)
    w.position.y = damp(w.position.y, -pointer.y * 0.8, 1.1, dt) // light parallax
  })
  return <group ref={world}>{children}</group>
}

const Zone = ({ index, children }) => <group position={[index * ZONE_GAP, 0, 0]}>{children}</group>

export default function Cosmos({ section }) {
  return (
    <>
      <World section={section}>
        {/* Home: one far galaxy */}
        <Zone index={0}>
          <Galaxy position={[-42, 26, -95]} rotation={[1.1, 0, 0.4]} radius={11} inside="#ffd9a0" outside="#6a3cff" seed={1} />
        </Zone>

        {/* Work: cyan-lime nebula */}
        <Zone index={1}>
          <Nebula position={[10, 10, -105]} scale={[90, 60, 1]} colorA="#0fb7ff" colorB="#d4ff3a" seed={9} />
        </Zone>

        {/* History: purple nebula */}
        <Zone index={2}>
          <Nebula position={[-25, 5, -100]} scale={[100, 65, 1]} colorA="#5b1fff" colorB="#ff2fa8" seed={4} />
        </Zone>

        {/* Tools: a galaxy cluster above the toolbox grid */}
        <Zone index={3}>
          <Nebula position={[0, 15, -115]} scale={[130, 60, 1]} colorA="#2a0f6b" colorB="#13d3ff" seed={15} />
          <Galaxy position={[-34, 16, -90]} rotation={[1.0, 0, 0.4]} radius={14} inside="#ffd9a0" outside="#6a3cff" seed={5} />
          <Galaxy position={[38, 14, -100]} rotation={[0.6, 0, -0.6]} radius={12} branches={3} inside="#d4ff3a" outside="#13d3ff" seed={2} speed={-0.03} />
          <Galaxy position={[4, 34, -120]} rotation={[1.4, 0, 0]} radius={9} count={9000} branches={2} inside="#ffffff" outside="#ff3ab4" seed={3} />
        </Zone>
      </World>
      <Comets />
    </>
  )
}
