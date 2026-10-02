import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bot, Minus, Pause, Play, Plus, Radio, RotateCcw, ZoomIn } from 'lucide-react'
import type { Group } from 'three'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { UseSession, UseSessionStatus } from '@deepseek-ai/dsh-client-ui-session/client'
import type { TeamProjection, TeamMemberProjection } from '@deepseek-ai/dsh-experimental-agent-team/client'
import type { Member, MemberStatus } from './teamData'
import './OfficeScene.css'
import './office.css'

type SessionsState = {
  phase: 'pending' | 'ready'
  byId: Record<string, { running: boolean; cwd?: string }>
  projectionsBySession: Record<string, { values: { agentTeam?: TeamProjection } }>
}
type LiveMember = Member & { canWander: boolean; runtimeLabel: string }
type HookProps = {
  sessionId: SessionId
  useSession: UseSession
  useSessions: <T>(selector: (state: SessionsState) => T) => T
  useSessionStatus: UseSessionStatus
}

function LiveDesk({member,index,selected,onSelect,canWander,ambientPaused,columns,rows,sceneWidth,sceneDepth}:{member:LiveMember;index:number;selected:boolean;onSelect:()=>void;canWander:boolean;ambientPaused:boolean;columns:number;rows:number;sceneWidth:number;sceneDepth:number}) {
  const spacingX=Math.min(2.65,10.4/Math.max(1,columns-1))
  const spacingZ=Math.min(3.1,7.2/Math.max(1,rows-1))
  const x=(index%columns-(columns-1)/2)*spacingX
  const z=(Math.floor(index/columns)-(rows-1)/2)*spacingZ
  const body=React.useRef<Group>(null)
  const memberHash=Array.from(member.id).reduce((hash,char)=>Math.imul(hash,31)+char.charCodeAt(0)|0,0)>>>0
  const walkPhase=(memberHash*0.0001)%(Math.PI*2)
  useFrame(({clock})=>{
    if (!body.current) return
    if (!canWander) {
      body.current.position.set(0,1.03+Math.sin(clock.elapsedTime*3+index)*0.025,.43)
      body.current.rotation.y=0
      return
    }
    if (ambientPaused) return
    if (canWander) {
      const cycleDuration=32
      const cycle=((clock.elapsedTime+walkPhase*cycleDuration/(Math.PI*2))%cycleDuration+cycleDuration)%cycleDuration
      // Route around the open aisle in front of the desk, not through the desk/chair footprint.
      // The narrow spacing between workstation columns makes a full-width ellipse unsafe.
      const orbitRadiusX=Math.min(1.15,Math.max(0.55,sceneWidth/2-1.25))
      const orbitRadiusZ=Math.min(0.45,Math.max(0.2,sceneDepth/2-1.25))
      const orbitCenterZ=Math.max(-sceneDepth/2+1.25+orbitRadiusZ,Math.min(sceneDepth/2-1.25-orbitRadiusZ,z+1.55))
      const orbitStartX=x+orbitRadiusX
      const orbitStartZ=orbitCenterZ-z

      let targetX=0, targetZ=0, heading=0
      if (cycle<18) {
        const angle=(cycle/18)*Math.PI*2
        targetX=Math.cos(angle)*orbitRadiusX
        targetZ=orbitCenterZ-z+Math.sin(angle)*orbitRadiusZ
        heading=angle-Math.PI/2
      } else if (cycle<22) {
        const progress=(cycle-18)/4
        const eased=progress*progress*(3-2*progress)
        targetX=orbitStartX*(1-eased)
        targetZ=orbitStartZ
        heading=Math.atan2(-orbitStartX,0)
      } else if (cycle<28) {
        targetX=0
        targetZ=orbitStartZ
        heading=0
      } else {
        const progress=(cycle-28)/4
        const eased=progress*progress*(3-2*progress)
        targetX=orbitStartX*eased
        targetZ=orbitStartZ
        heading=Math.atan2(orbitStartX,0)
      }
      body.current.position.set(targetX,1.03+Math.abs(Math.sin(clock.elapsedTime*4+walkPhase))*0.025,targetZ)
      body.current.rotation.y=heading
    } else {
      body.current.position.set(0,1.03+Math.sin(clock.elapsedTime*3+index)*0.025,.43)
      body.current.rotation.y=0
    }
  })
  const colors=['#a78bfa','#60a5fa','#fb923c','#4ade80','#f472b6']
  const accent=colors[index%colors.length]
  const running=member.status==='Working'
  return <group position={[x,0,z]} onClick={(event)=>{event.stopPropagation();onSelect()}}><RoundedBox args={[1.8,0.13,1.08]} radius={0.06} position={[0,0.91,0]} castShadow><meshStandardMaterial color="#75553e"/></RoundedBox>{[[-.73,.43,-.39],[.73,.43,-.39],[-.73,.43,.39],[.73,.43,.39]].map(([a,b,c],i)=><mesh key={i} position={[a,b,c]} castShadow><boxGeometry args={[.09,.87,.09]}/><meshStandardMaterial color="#443c37"/></mesh>)}<mesh position={[0,.99,.54]}><boxGeometry args={[1.78,.13,.035]}/><meshStandardMaterial color={selected?accent:'#a07655'} emissive={selected?accent:'#000000'} emissiveIntensity={selected?.25:0}/></mesh><mesh position={[0,.78,-.03]}><boxGeometry args={[.53,.035,.36]}/><meshStandardMaterial color="#aeb5c1" metalness={.65}/></mesh><mesh position={[0,.98,-.17]}><boxGeometry args={[.52,.34,.025]}/><meshStandardMaterial color={running?'#164252':'#222532'} emissive={running?'#0f4555':'#000000'} emissiveIntensity={running?.55:0}/></mesh><mesh position={[0,.45,.53]}><boxGeometry args={[.55,.12,.5]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[0,.78,.75]}><boxGeometry args={[.55,.55,.1]}/><meshStandardMaterial color={accent}/></mesh><group ref={body} position={[0,1.03,.43]}><mesh><capsuleGeometry args={[.19,.37,4,8]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[0,.43,.02]}><sphereGeometry args={[.18,20,16]}/><meshStandardMaterial color="#e7b99d"/></mesh></group><Html position={[0,2.1,0]} center distanceFactor={8}><div className={`office-tag ${selected?'office-tag-selected':''}`}><span aria-hidden="true" className={`office-tag-dot ${running?'office-working':'office-idle'}`}/><span>{member.name}</span><small>{member.runtimeLabel}</small></div></Html><mesh position={[0,.2,.53]}><cylinderGeometry args={[.045,.045,.38,12]}/><meshStandardMaterial color="#4c5360"/></mesh></group>
}

function OfficeCameraController({controls,cameraRequest,cancelTransitionRef}:{controls:React.MutableRefObject<any>;cameraRequest:{position:[number,number,number];target:[number,number,number];instant:boolean}|null;cancelTransitionRef:React.MutableRefObject<()=>void>}) {
  const transition=useRef<{request:NonNullable<typeof cameraRequest>;elapsed:number;startPosition:{x:number;y:number;z:number};startTarget:{x:number;y:number;z:number}}|null>(null)
  const handledRequest=useRef(cameraRequest)
  useEffect(()=>{cancelTransitionRef.current=()=>{transition.current=null}},[cancelTransitionRef])
  useFrame(({camera})=>{
    const orbit=controls.current
    if (!cameraRequest||cameraRequest===handledRequest.current||!orbit) return
    handledRequest.current=cameraRequest
    if (cameraRequest.instant) {
      camera.position.set(...cameraRequest.position)
      orbit.target.set(...cameraRequest.target)
      orbit.update()
      transition.current=null
      return
    }
    transition.current={request:cameraRequest,elapsed:0,startPosition:camera.position.clone(),startTarget:orbit.target.clone()}
  })
  useFrame(({camera},delta)=>{
    const current=transition.current
    const orbit=controls.current
    if (!current||!orbit) return
    current.elapsed=Math.min(current.elapsed+delta,0.35)
    const t=current.elapsed/0.35
    const eased=t*t*(3-2*t)
    camera.position.set(
      current.startPosition.x+(current.request.position[0]-current.startPosition.x)*eased,
      current.startPosition.y+(current.request.position[1]-current.startPosition.y)*eased,
      current.startPosition.z+(current.request.position[2]-current.startPosition.z)*eased,
    )
    orbit.target.set(
      current.startTarget.x+(current.request.target[0]-current.startTarget.x)*eased,
      current.startTarget.y+(current.request.target[1]-current.startTarget.y)*eased,
      current.startTarget.z+(current.request.target[2]-current.startTarget.z)*eased,
    )
    orbit.update()
    if (t>=1) transition.current=null
  })
  return null
}

export function LiveTeamOffice({ sessionId, useSession, useSessions, useSessionStatus }: HookProps) {
  const session = useSession((snapshot: { subagent?: { address?: { parentSessionId?: SessionId } } }) => snapshot) as { subagent?: { address?: { parentSessionId?: SessionId } } }
  const leadSessionId = session.subagent?.address?.parentSessionId ?? sessionId
  const data = useSessions((state) => ({ phase: state.phase, team: state.projectionsBySession[leadSessionId]?.values.agentTeam, sessionById: state.byId }))
  const statuses = useSessionStatus((state: ReadonlyMap<SessionId, import('@deepseek-ai/dsh-client-ui-session/client').SessionStatus>) => state)
  const [selected, setSelected] = useState<string | null>(null)
  const columns=Math.min(3,Math.max(1,Math.ceil(Math.sqrt(data.team?.members.length??0))))
  const rows=Math.max(1,Math.ceil((data.team?.members.length??0)/columns))
  const spacingX=Math.min(2.65,10.4/Math.max(1,columns-1))
  const spacingZ=Math.min(3.1,7.2/Math.max(1,rows-1))
  const sceneWidth=Math.max(6,Math.min(12,(columns-1)*spacingX+4.4))
  const sceneDepth=Math.max(6,Math.min(10,(rows-1)*spacingZ+3.6))
  const [reducedMotion,setReducedMotion]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [ambientPaused,setAmbientPaused]=useState(reducedMotion)
  React.useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
    const onPreferenceChange=(event:MediaQueryListEvent)=>{
      setReducedMotion(event.matches)
      if(event.matches)setAmbientPaused(true)
    }
    preference.addEventListener('change',onPreferenceChange)
    return ()=>preference.removeEventListener('change',onPreferenceChange)
  },[])
  const [cameraRequest,setCameraRequest]=useState<{position:[number,number,number];target:[number,number,number];instant:boolean}|null>(null)
  const controlsRef=useRef<any>(null)
  const cancelCameraTransition=useRef<()=>void>(()=>{})
  const members: LiveMember[] = useMemo(() => data.team?.members.map((member: TeamMemberProjection, index): LiveMember => {
    const isRunning = statuses.get(member.id)?.running ?? data.sessionById[member.id]?.running ?? false
    const status: MemberStatus = member.phase === 'failed' ? 'Done' : member.phase === 'provisioning' ? 'Idle' : isRunning ? 'Working' : 'Idle'
    const color = ['violet', 'blue', 'orange', 'green', 'pink'][index % 5]
    const runtimeLabel=member.phase==='failed'?'DSH lifecycle: failed':member.phase==='provisioning'?'DSH lifecycle: provisioning':isRunning?'DSH runtime: running':'DSH runtime: inactive'
    return {id:member.id,name:member.name,role:member.role==='lead'?'Team lead':'Agent teammate',initials:member.name.slice(0,2).toUpperCase(),color,status,task:member.error??(member.phase==='failed'?'Agent failed to start':isRunning?'Agent session is running':member.phase==='provisioning'?'Starting agent…':'Waiting / inactive'),progress:status==='Working'?55:status==='Done'?100:0,model:data.sessionById[member.id]?.cwd??'DSH session',branch:member.role==='lead'?'Team lead session':'Teammate session',lastActive:isRunning?'Running now':member.phase,canWander:member.phase==='active'&&!isRunning,runtimeLabel}
  }) ?? [], [data.sessionById, data.team, statuses])
  const tasks = data.team?.tasks ?? []
  const zoomCamera=(direction:'in'|'out')=>{
    const controls=controlsRef.current
    if(!controls)return
    cancelCameraTransition.current()
    const camera=controls.object
    const offset=camera.position.clone().sub(controls.target)
    const currentDistance=offset.length()
    const nextDistance=Math.max(7,Math.min(22,currentDistance*(direction==='in'?0.82:1.22)))
    if(currentDistance===0)return
    camera.position.copy(controls.target).add(offset.multiplyScalar(nextDistance/currentDistance))
    controls.update()
  }
  const requestCamera=(member:LiveMember|null)=>{
    const instant=reducedMotion
    const index=member?members.findIndex((item)=>item.id===member.id):-1
    const memberX=member?(index%columns-(columns-1)/2)*spacingX:0
    const memberZ=member?(Math.floor(index/columns)-(rows-1)/2)*spacingZ:0
    const target: [number,number,number]=member?[memberX,0.7,memberZ]:[0,0.65,0]
    const distance=Math.max(8,Math.min(22,Math.max(sceneWidth,sceneDepth)*1.25))
    const position: [number,number,number]=member?[target[0]+4,target[1]+4.5,target[2]+5]:[distance*.65,distance*.62,distance*.9]
    setCameraRequest({position,target,instant})
  }
  const selectedMember = members.find((member) => member.id === selected)
  if (data.phase === 'pending' && !data.team) return <div className="live-empty"><Radio size={16}/>Đang đọc trạng thái Session từ DSH…</div>
  if (!data.team) return <div className="live-empty"><Bot size={20}/><div><strong>Chưa tìm thấy Agent Team trong Session này</strong><span>Mở cuộc trò chuyện Lead có Agent Team đang hoạt động. DSH chưa phát projection `agentTeam` cho Session hiện tại.</span></div></div>
  return <section className="live-team-view"><header className="live-team-header"><div><div className="eyebrow"><span className="eyebrow-line"/> DSH LIVE SESSION</div><h2>Đội Agent đang hoạt động</h2><p>{members.length} thành viên · {tasks.length} shared tasks · cập nhật từ DSH Session projection</p></div><div className="live-camera-controls" role="group" aria-label="Office view controls"><button className="live-control-button live-motion-button" type="button" onClick={()=>setAmbientPaused((paused)=>!paused)} aria-pressed={ambientPaused} aria-label={ambientPaused?'Resume ambient office animation':'Pause ambient office animation'}>{ambientPaused?<Play size={14} aria-hidden="true"/>:<Pause size={14} aria-hidden="true"/>}<span>{ambientPaused?'Resume motion':'Pause motion'}</span></button><span className="live-control-divider" aria-hidden="true"/><button className="live-control-button live-icon-button" type="button" onClick={()=>zoomCamera('in')} aria-label="Zoom in"><Plus size={15} aria-hidden="true"/><span className="sr-only">Zoom in</span></button><button className="live-control-button live-icon-button" type="button" onClick={()=>zoomCamera('out')} aria-label="Zoom out"><Minus size={15} aria-hidden="true"/><span className="sr-only">Zoom out</span></button><span className="live-control-divider" aria-hidden="true"/><button className="live-control-button live-overview-button" type="button" onClick={()=>requestCamera(null)} aria-label="Reset camera to full team overview"><RotateCcw size={14} aria-hidden="true"/><span>Overview</span></button>{selectedMember&&<button className="live-control-button live-focus-button" type="button" onClick={()=>requestCamera(selectedMember)} aria-label={`Focus camera on ${selectedMember.name}'s workstation`}><ZoomIn size={14} aria-hidden="true"/><span>Focus workstation</span></button>}</div><span className="live-source-badge"><i/> LIVE DSH</span></header>{data.team.failure&&<div className="live-warning">Projection của Agent Team có lỗi: {data.team.failure}</div>}<div className="live-team-grid"><div className="live-office-canvas"><Canvas shadows camera={{position:[8,8,11],fov:43}} dpr={[1,1.5]}><OfficeCameraController controls={controlsRef} cameraRequest={cameraRequest} cancelTransitionRef={cancelCameraTransition}/><color attach="background" args={['#11151b']}/><ambientLight intensity={1.2}/><directionalLight position={[-4,8,5]} intensity={2} castShadow/><pointLight position={[0,4,-3]} intensity={35} color="#7e74ff" distance={12}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.08,0]} receiveShadow><planeGeometry args={[sceneWidth,sceneDepth]}/><meshStandardMaterial color="#20242b"/></mesh><gridHelper args={[sceneWidth,Math.max(12,columns*8),'#3a3e49','#282c34']} position={[0,-0.06,0]}/>{members.map((member,index)=><LiveDesk key={member.id} member={member} index={index} selected={selected===member.id} canWander={member.canWander} ambientPaused={ambientPaused} columns={columns} rows={rows} sceneWidth={sceneWidth} sceneDepth={sceneDepth} onSelect={()=>{setSelected(member.id);requestCamera(member)}}/>)}<ContactShadows position={[0,-0.055,0]} opacity={0.4} scale={14} blur={2.5} far={4}/><OrbitControls ref={controlsRef} makeDefault enableRotate enableZoom enablePan minDistance={7} maxDistance={22} maxPolarAngle={Math.PI/2.05} target={[0,0.65,0]} onStart={()=>cancelCameraTransition.current()}/><OrbitControls ref={controlsRef} makeDefault enableRotate enableZoom enablePan minDistance={7} maxDistance={22} maxPolarAngle={Math.PI/2.05} target={[0,0.65,0]} onStart={()=>cancelCameraTransition.current()}/></Canvas><div className="live-canvas-caption">REAL DSH SESSIONS · CLICK A DESK TO INSPECT</div></div><aside className="live-team-roster"><h3>Member states</h3>{members.map((member)=><button className={`live-member-row ${selected===member.id?'is-selected':''}`} key={member.id} onClick={()=>{setSelected(member.id);requestCamera(member)}}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><span className="live-member-copy"><strong>{member.name}{member.role==='Team lead'?' · Lead':''}</strong><small>{member.task}</small><small className="live-status-source">{member.runtimeLabel}</small></span><span className={`live-agent-dot ${member.status==='Working'?'is-running':''}`} aria-hidden="true"/></button>)}<h3>Shared tasks</h3>{tasks.length?tasks.map((task)=><div className="live-task-row" key={task.id}><strong>{task.subject}</strong><small>{task.status.replace('_',' ')} · {task.ownerName??'Unassigned'}{task.ready?' · ready':' · blocked'}</small></div>):<p className="live-no-tasks">Chưa có shared tasks.</p>}{selectedMember&&<div className="live-selected-detail"><b>{selectedMember.name}</b><span>{selectedMember.status} · {selectedMember.role}</span></div>}</aside></div><div className="live-data-note">Trạng thái “đang chạy” lấy từ DSH Session runtime. Agent Team hiện chỉ xuất bản roster và shared tasks; chưa có event feed chi tiết cho từng hành động/công cụ, nên không mô phỏng giao việc/typing animation từ dữ liệu giả.</div></section>
}
