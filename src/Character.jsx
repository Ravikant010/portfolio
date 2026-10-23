import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Mannequin from Quaternius's Universal Animation Library (CC0), trimmed to four clips in Blender.
const URL = '/models/mannequin.glb'
useGLTF.preload(URL)

// One animation per section; actions cross-fade when the section changes.
const CLIPS = {
  home: 'Dance_Loop',
  work: 'Sitting_Talking_Loop',
  history: 'Walk_Formal_Loop',
  tools: 'Punch_Cross',
}
// Fashion-display finish: glossy black body, lime joints (keys are the model's material names).
const FINISH = {
  M_Main: { color: '#111114', roughness: 0.22, metalness: 0.35 },
  M_Joints: { color: '#d4ff3a', roughness: 0.4, metalness: 0, emissive: 0.6 },
}
const HEIGHT = 1.9 // match the scene's platform: feet at -0.95

export default function Character({ pose = 'home' }) {
  const group = useRef()
  const { scene, animations } = useGLTF(URL)
  const { actions } = useAnimations(animations, group)

  // Scale to HEIGHT and stand the feet on the platform.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const s = HEIGHT / (box.max.y - box.min.y)
    return { scale: s, y: -HEIGHT / 2 - box.min.y * s }
  }, [scene])

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return
      const f = FINISH[o.material.name]
      if (!f) return
      o.material.color.set(f.color)
      o.material.roughness = f.roughness
      o.material.metalness = f.metalness
      if (f.emissive) {
        o.material.emissive.set(f.color)
        o.material.emissiveIntensity = f.emissive
      }
    })
  }, [scene])

  useEffect(() => {
    const action = actions[CLIPS[pose]]
    if (!action) return
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.5).play()
    return () => action.fadeOut(0.5)
  }, [actions, pose])

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={fit.scale} position={[0, fit.y, 0]} />
    </group>
  )
}
