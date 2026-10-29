import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Holographic pedestal under the character. Colours are pushed past 1 so Bloom picks them up.
const LIME = new THREE.Color(0.83, 1, 0.23)
const glow = (k) => LIME.clone().multiplyScalar(k)
const additive = { transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }

// Radial fade for the floor disc and the beam (bright centre/bottom, transparent edge/top).
export function fadeMaterial(axis, strength, color = LIME) {
  return new THREE.ShaderMaterial({
    ...additive,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: color.clone().multiplyScalar(strength) } },
    vertexShader: `varying vec2 vUv; varying float vFacing;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // 1 where the surface faces the camera, 0 at the silhouette: softens the beam's side edges.
        vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 uColor; varying vec2 vUv; varying float vFacing;
      void main() {
        float d = ${axis === 'radial' ? 'length(vUv - 0.5) * 2.0' : 'vUv.y'};
        float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2)${axis === 'radial' ? '' : ' * vFacing * vFacing'};
        gl_FragColor = vec4(uColor * a, a);
      }`,
  })
}

const PULSES = 3
const DASHES = 40

export default function Platform({ y = -0.97 }) {
  const ring = useRef()
  const dashes = useRef()
  const pulses = useRef([])
  const floor = useMemo(() => fadeMaterial('radial', 0.9), [])
  const beam = useMemo(() => fadeMaterial('height', 0.12), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    ring.current.rotation.z += dt * 0.6
    dashes.current.rotation.y -= dt * 0.35
    // Each pulse grows from the ring and fades out, staggered in time.
    pulses.current.forEach((p, i) => {
      if (!p) return
      const k = (t * 0.45 + i / PULSES) % 1
      p.scale.setScalar(1 + k * 1.1)
      p.material.opacity = (1 - k) * 0.9
    })
  })

  return (
    <group position={[0, y, 0]}>
      {/* soft glow pooled on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor}>
        <planeGeometry args={[2.2, 2.2]} />
      </mesh>
      {/* main ring */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.012, 16, 160]} />
        <meshBasicMaterial color={glow(4)} toneMapped={false} />
      </mesh>
      {/* inner thin ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.004, 8, 120]} />
        <meshBasicMaterial color={glow(2)} toneMapped={false} />
      </mesh>
      {/* outer dashed ring, counter-rotating */}
      <group ref={dashes}>
        {Array.from({ length: DASHES }, (_, i) => {
          const a = (i / DASHES) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.012, 0.006, 0.07]} />
              <meshBasicMaterial color={glow(2.5)} toneMapped={false} />
            </mesh>
          )
        })}
      </group>
      {/* ripples */}
      {Array.from({ length: PULSES }, (_, i) => (
        <mesh key={i} ref={(el) => (pulses.current[i] = el)} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.006, 8, 120]} />
          <meshBasicMaterial color={glow(2)} {...additive} />
        </mesh>
      ))}
      {/* faint beam rising around the figure */}
      <mesh position={[0, 1.1, 0]} material={beam}>
        <cylinderGeometry args={[0.6, 0.6, 2.2, 64, 1, true]} />
      </mesh>
    </group>
  )
}
