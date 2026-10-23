import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// "Roadster in orbit" backdrop: starfield, a procedural Earth with atmosphere, and a sun.
const SUN = new THREE.Vector3(1, 0.35, 0.25).normalize()

const NOISE = `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`

const earthMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vObj; varying vec3 vN; varying vec3 vView;
      void main() {
        vObj = position;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vView = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uSun; uniform float uTime; varying vec3 vObj; varying vec3 vN; varying vec3 vView;
      ${NOISE}
      void main() {
        vec3 p = normalize(vObj);
        float land = smoothstep(0.52, 0.56, fbm(p * 2.2));
        float ice = smoothstep(0.82, 0.9, abs(p.y));
        vec3 ocean = mix(vec3(0.01, 0.05, 0.16), vec3(0.03, 0.18, 0.38), fbm(p * 6.0));
        vec3 ground = mix(vec3(0.09, 0.2, 0.06), vec3(0.35, 0.28, 0.16), fbm(p * 9.0));
        vec3 col = mix(mix(ocean, ground, land), vec3(0.75), ice);
        float clouds = smoothstep(0.55, 0.75, fbm(p * 4.0 + vec3(uTime * 0.01, 0.0, 0.0)));
        col = mix(col, vec3(0.85), clouds * 0.6);
        float day = dot(normalize(vN), uSun);
        vec3 lit = col * smoothstep(-0.15, 0.6, day) * 0.75;
        // city lights on the night side
        lit += vec3(1.0, 0.7, 0.3) * land * (1.0 - clouds) * smoothstep(0.62, 0.7, fbm(p * 30.0)) * smoothstep(0.1, -0.2, day) * 0.6;
        // ocean glint
        vec3 h = normalize(uSun + vView);
        lit += vec3(1.0, 0.9, 0.7) * pow(max(dot(normalize(vN), h), 0.0), 60.0) * (1.0 - land) * (1.0 - clouds) * 0.8;
        gl_FragColor = vec4(lit, 1.0);
      }`,
  })

const atmosphereMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: { uSun: { value: SUN } },
    vertexShader: `varying vec3 vN; varying vec3 vView;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vView = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vView;
      void main() {
        float rim = pow(clamp(1.0 + dot(vN, vView), 0.0, 1.0), 3.0);
        float lit = smoothstep(-0.3, 0.5, dot(vN, uSun));
        vec3 c = vec3(0.3, 0.6, 1.0) * rim * lit * 1.6;
        gl_FragColor = vec4(c, rim * lit);
      }`,
  })

function Earth() {
  const earth = useRef()
  const mat = useMemo(() => earthMaterial(), [])
  const atmo = useMemo(() => atmosphereMaterial(), [])

  useFrame(({ clock }, dt) => {
    earth.current.rotation.y += dt * 0.01
    earth.current.material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group position={[-4, -31, -30]} rotation={[1.2, 0, 0.3]}>
      <mesh ref={earth} material={mat}>
        <sphereGeometry args={[24, 160, 160]} />
      </mesh>
      <mesh material={atmo} scale={1.04}>
        <sphereGeometry args={[24, 96, 96]} />
      </mesh>
    </group>
  )
}

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

// Glides to its section's spot, then drifts and tumbles slowly, like the real one in orbit.
function Roadster({ section }) {
  const car = useRef()
  const { scene } = useGLTF(ROADSTER)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const c = car.current
    const [x, y] = SPOTS[section]
    c.position.x = damp(c.position.x, x + Math.sin(t * 0.08) * 0.3, 1.5, dt)
    c.position.y = damp(c.position.y, y + Math.sin(t * 0.13) * 0.2, 1.5, dt)
    c.position.z = -8
    c.rotation.set(0.35 + Math.sin(t * 0.1) * 0.15, t * 0.12, 0.25 + Math.cos(t * 0.09) * 0.1)
  })

  return <primitive ref={car} object={scene} scale={0.5} position={[SPOTS[0][0], SPOTS[0][1], -8]} />
}

export default function Space({ section }) {
  return (
    <>
      <Stars radius={90} depth={40} count={5000} factor={4} saturation={0} fade speed={0.4} />
      <Earth />
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
