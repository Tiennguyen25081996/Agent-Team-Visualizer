import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Member } from './teamData'
import './OfficeScene.css'

type OfficeSceneProps = { members: Member[]; selectedId: string | null; onSelectMember: (id: string) => void }

const palette: Record<string, string> = {
  violet: '#a78bfa', blue: '#60a5fa', orange: '#fb923c', green: '#4ade80', pink: '#f472b6',
}

function Laptop({ accent, working }: { accent: string; working: boolean }) {
  const screen = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (screen.current && working) screen.current.rotation.z = Math.sin(clock.elapsedTime * 1.8) * 0.025
  })
  return <group position={[0, 0.78, -0.03]}>
    <mesh position={[0, 0.035, 0]} rotation={[-0.08, 0, 0]}><boxGeometry args={[0.53, 0.035, 0.36]} /><meshStandardMaterial color="#aeb5c1" metalness={0.65} roughness={0.3} /></mesh>
    <mesh ref={screen} position={[0, 0.22, -0.14]} rotation={[-0.12, 0, 0]}><boxGeometry args={[0.52, 0.34, 0.025]} /><meshStandardMaterial color="#1d2432" metalness={0.3} roughness={0.35} /></mesh>
    <mesh position={[0, 0.22, -0.122]} rotation={[-0.12, 0, 0]}><planeGeometry args={[0.46, 0.27]} /><meshBasicMaterial color={working ? '#102a35' : '#222532'} /></mesh>
    {working && <group position={[-0.14, 0.22, -0.105]}>{[0,1,2].map((i) => <mesh key={i} position={[i*0.09, Math.sin(i*3+1)*0.045, 0]}><boxGeometry args={[0.055, 0.018, 0.002]} /><meshBasicMaterial color={accent} /></mesh>)}</group>}
  </group>
}

function Chair({ accent }: { accent: string }) {
  return <group position={[0, 0, 0.53]}>
    <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.55, 0.12, 0.5]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
    <mesh position={[0, 0.78, 0.22]}><boxGeometry args={[0.55, 0.55, 0.1]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.045, 0.045, 0.38, 12]} /><meshStandardMaterial color="#4c5360" metalness={0.6} /></mesh>
    <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.32, 0.28, 0.05, 5]} /><meshStandardMaterial color="#4c5360" metalness={0.55} /></mesh>
  </group>
}

function Worker({ member, accent, isDelivering, isWorking }: { member: Member; accent: string; isDelivering: boolean; isWorking: boolean }) {
  const body = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (body.current) {
      body.current.position.y = 0.91 + Math.sin(t * (isWorking ? 5 : 1.5) + member.id.length) * (isWorking ? 0.018 : 0.008)
      body.current.rotation.y = isDelivering ? Math.sin(t * 1.4) * 0.25 : Math.sin(t * 0.5 + member.id.length) * 0.035
    }
    if (armL.current) armL.current.rotation.x = isWorking ? Math.sin(t * 9 + 1) * 0.22 - 0.45 : 0.05
    if (armR.current) armR.current.rotation.x = isWorking ? Math.sin(t * 9) * 0.22 - 0.45 : 0.05
    if (legL.current) legL.current.rotation.x = isDelivering ? Math.sin(t * 7) * 0.38 : 0
    if (legR.current) legR.current.rotation.x = isDelivering ? Math.sin(t * 7 + Math.PI) * 0.38 : 0
  })
  return <group ref={body} position={[0, 0.91, 0.45]}>
    <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.19, 0.37, 4, 8]} /><meshStandardMaterial color={accent} roughness={0.6} /></mesh>
    <mesh position={[0, 0.25, 0.02]}><sphereGeometry args={[0.18, 24, 20]} /><meshStandardMaterial color="#e7b99d" roughness={0.75} /></mesh>
    <mesh position={[0, 0.31, 0.035]}><sphereGeometry args={[0.185, 24, 14, 0, Math.PI*2, 0, Math.PI*0.52]} /><meshStandardMaterial color="#4c3540" roughness={0.8} /></mesh>
    <group ref={armL} position={[-0.2, -0.06, -0.02]}><mesh position={[0, -0.17, 0]} rotation={[0.25,0,-0.12]}><capsuleGeometry args={[0.07,0.23,4,8]} /><meshStandardMaterial color={accent} /></mesh></group>
    <group ref={armR} position={[0.2, -0.06, -0.02]}><mesh position={[0, -0.17, 0]} rotation={[0.25,0,0.12]}><capsuleGeometry args={[0.07,0.23,4,8]} /><meshStandardMaterial color={accent} /></mesh></group>
    <group ref={legL} position={[-0.09,-0.36,0]}><mesh position={[0,-0.17,0.02]}><capsuleGeometry args={[0.075,0.22,4,8]} /><meshStandardMaterial color="#343542" /></mesh></group>
    <group ref={legR} position={[0.09,-0.36,0]}><mesh position={[0,-0.17,0.02]}><capsuleGeometry args={[0.075,0.22,4,8]} /><meshStandardMaterial color="#343542" /></mesh></group>
    {isDelivering && <mesh position={[0.33, 0.01, -0.04]} rotation={[0,0,-0.2]}><boxGeometry args={[0.14,0.17,0.025]} /><meshStandardMaterial color="#f5d58b" /></mesh>}
  </group>
}

function DeskStation({ member, index, selected, onSelectMember }: { member: Member; index: number; selected: boolean; onSelectMember: (id: string) => void }) {
  const accent = palette[member.color] ?? '#9da3b2'
  const isDelivering = member.status === 'Delivering'
  const isWorking = member.status === 'Working' || member.status === 'Reviewing'
  const x = (index % 3 - 1) * 2.65
  const z = Math.floor(index / 3) * 3.15 - 0.2
  const walking = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!walking.current) return
    const t = clock.elapsedTime * 0.7 + index * 1.7
    if (isDelivering) {
      walking.current.visible = true
      walking.current.position.set(x + Math.sin(t) * 0.62, 0, z + Math.cos(t * 0.7) * 0.48)
      walking.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.7))
    } else {
      walking.current.visible = false
    }
  })
  return <group position={[x, 0, z]}>
    <group onClick={(event) => { event.stopPropagation(); onSelectMember(member.id) }}>
      <RoundedBox args={[1.8,0.13,1.08]} radius={0.06} position={[0,0.91,0]} castShadow receiveShadow><meshStandardMaterial color="#75553e" roughness={0.65} /></RoundedBox>
      {[[-0.73,0.43,-0.39],[0.73,0.43,-0.39],[-0.73,0.43,0.39],[0.73,0.43,0.39]].map(([lx,ly,lz], i) => <mesh key={i} position={[lx,ly,lz]} castShadow><boxGeometry args={[0.09,0.87,0.09]} /><meshStandardMaterial color="#443c37" /></mesh>)}
      <mesh position={[0,0.99,0.54]}><boxGeometry args={[1.78,0.13,0.035]} /><meshStandardMaterial color={selected ? accent : '#a07655'} emissive={selected ? accent : '#000000'} emissiveIntensity={selected ? 0.25 : 0} /></mesh>
      <Laptop accent={accent} working={isWorking} />
      <mesh position={[-0.62,0.99,-0.1]}><cylinderGeometry args={[0.1,0.1,0.018,24]} /><meshStandardMaterial color="#bf8664" /></mesh>
      <mesh position={[-0.62,1.13,-0.1]}><cylinderGeometry args={[0.024,0.035,0.28,10]} /><meshStandardMaterial color="#719c71" /></mesh>
      <Chair accent={accent} />
      {!isDelivering && <Worker member={member} accent={accent} isWorking={isWorking} isDelivering={false} />}
    </group>
    <group ref={walking} visible={false}>
      <Worker member={member} accent={accent} isWorking={false} isDelivering />
    </group>
    <Html position={[0,2.1,0]} center distanceFactor={8} style={{ pointerEvents:'none' }}>
      <div className={`office-tag ${selected ? 'office-tag-selected' : ''}`}><span className={`office-tag-dot office-${member.status.toLowerCase()}`} />{member.name}<small>{member.status === 'Delivering' ? 'DELIVERING' : member.status.toUpperCase()}</small></div>
    </Html>
    <Html position={[0,0.08,1.05]} center distanceFactor={8} style={{ pointerEvents:'none' }}><div className="desk-nameplate">{member.name}</div></Html>
  </group>
}

function OfficeRoom({ members, selectedId, onSelectMember }: OfficeSceneProps) {
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color:'#20242b', roughness:0.9 }), [])
  return <>
    <color attach="background" args={['#11151b']} />
    <fog attach="fog" args={['#11151b',12,24]} />
    <ambientLight intensity={1.15} />
    <hemisphereLight args={['#c9d8ff','#302820',1.1]} />
    <directionalLight position={[-4,8,5]} intensity={2.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <pointLight position={[0,4,-3]} intensity={40} color="#7e74ff" distance={12} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.08,0]} receiveShadow material={floorMaterial}><planeGeometry args={[12,10]} /></mesh>
    <gridHelper args={[12,24,'#3a3e49','#282c34']} position={[0,-0.06,0]} />
    <mesh position={[0,1.8,-4.95]}><boxGeometry args={[12,3.8,0.15]} /><meshStandardMaterial color="#24232e" roughness={0.9} /></mesh>
    <mesh position={[0,1.92,-4.85]}><boxGeometry args={[6.4,1.45,0.03]} /><meshStandardMaterial color="#181a22" emissive="#292446" emissiveIntensity={0.6} /></mesh>
    <Html position={[0,2.04,-4.78]} center distanceFactor={8} style={{ pointerEvents:'none' }}><div className="room-sign"><strong>AGENT OPERATIONS</strong><small>TEAM FLOOR · LIVE WORKSPACE</small></div></Html>
    {members.map((member,index)=><DeskStation key={member.id} member={member} index={index} selected={member.id===selectedId} onSelectMember={onSelectMember} />)}
    <ContactShadows position={[0,-0.055,0]} opacity={0.4} scale={14} blur={2.5} far={4} />
    <OrbitControls makeDefault minDistance={7} maxDistance={15} maxPolarAngle={Math.PI/2.05} target={[0,0.65,0]} />
  </>
}

export default function OfficeScene(props: OfficeSceneProps) {
  return <div className="office-canvas"><Canvas shadows camera={{ position:[8,8,11], fov:43 }} dpr={[1,1.7]} gl={{ antialias:true, alpha:false, powerPreference:'high-performance' }} onCreated={({ gl }) => { gl.setClearColor('#11151b', 1) }} fallback={<div className="scene-error-card"><strong>WebGL không được trình duyệt hỗ trợ</strong><span>Hãy bật tăng tốc phần cứng/WebGL rồi tải lại trang.</span></div>}><OfficeRoom {...props} /></Canvas></div>
}
