import React, { useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bot, Radio } from 'lucide-react'
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
type HookProps = {
  sessionId: SessionId
  useSession: UseSession
  useSessions: <T>(selector: (state: SessionsState) => T) => T
  useSessionStatus: UseSessionStatus
}

function LiveDesk({member,index,selected,onSelect}:{member:Member;index:number;selected:boolean;onSelect:()=>void}) {
  const x=(index%3-1)*2.65
  const z=Math.floor(index/3)*3.1-0.2
  const body=React.useRef<Group>(null)
  useFrame(({clock})=>{if(body.current)body.current.position.y=1.03+Math.sin(clock.elapsedTime*3+index)*0.025})
  const colors=['#a78bfa','#60a5fa','#fb923c','#4ade80','#f472b6']
  const accent=colors[index%colors.length]
  const running=member.status==='Working'
  return <group position={[x,0,z]} onClick={(event)=>{event.stopPropagation();onSelect()}}><RoundedBox args={[1.8,0.13,1.08]} radius={0.06} position={[0,0.91,0]} castShadow><meshStandardMaterial color="#75553e"/></RoundedBox>{[[-.73,.43,-.39],[.73,.43,-.39],[-.73,.43,.39],[.73,.43,.39]].map(([a,b,c],i)=><mesh key={i} position={[a,b,c]} castShadow><boxGeometry args={[.09,.87,.09]}/><meshStandardMaterial color="#443c37"/></mesh>)}<mesh position={[0,.99,.54]}><boxGeometry args={[1.78,.13,.035]}/><meshStandardMaterial color={selected?accent:'#a07655'} emissive={selected?accent:'#000000'} emissiveIntensity={selected?.25:0}/></mesh><mesh position={[0,.78,-.03]}><boxGeometry args={[.53,.035,.36]}/><meshStandardMaterial color="#aeb5c1" metalness={.65}/></mesh><mesh position={[0,.98,-.17]}><boxGeometry args={[.52,.34,.025]}/><meshStandardMaterial color={running?'#164252':'#222532'} emissive={running?'#0f4555':'#000000'} emissiveIntensity={running?.55:0}/></mesh><mesh position={[0,.45,.53]}><boxGeometry args={[.55,.12,.5]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[0,.78,.75]}><boxGeometry args={[.55,.55,.1]}/><meshStandardMaterial color={accent}/></mesh><group ref={body} position={[0,1.03,.43]}><mesh><capsuleGeometry args={[.19,.37,4,8]}/><meshStandardMaterial color={accent}/></mesh><mesh position={[0,.43,.02]}><sphereGeometry args={[.18,20,16]}/><meshStandardMaterial color="#e7b99d"/></mesh></group><Html position={[0,2.1,0]} center distanceFactor={8}><div className={`office-tag ${selected?'office-tag-selected':''}`}><span className={`office-tag-dot ${running?'office-working':'office-idle'}`}/>{member.name}<small>{member.status.toUpperCase()}</small></div></Html><mesh position={[0,.2,.53]}><cylinderGeometry args={[.045,.045,.38,12]}/><meshStandardMaterial color="#4c5360"/></mesh></group>
}

export function LiveTeamOffice({ sessionId, useSession, useSessions, useSessionStatus }: HookProps) {
  const session = useSession((snapshot: { subagent?: { address?: { parentSessionId?: SessionId } } }) => snapshot) as { subagent?: { address?: { parentSessionId?: SessionId } } }
  const leadSessionId = session.subagent?.address?.parentSessionId ?? sessionId
  const data = useSessions((state) => ({ phase: state.phase, team: state.projectionsBySession[leadSessionId]?.values.agentTeam, sessionById: state.byId }))
  const statuses = useSessionStatus((state: ReadonlyMap<SessionId, import('@deepseek-ai/dsh-client-ui-session/client').SessionStatus>) => state)
  const [selected, setSelected] = useState<string | null>(null)
  const members: Member[] = useMemo(() => data.team?.members.map((member: TeamMemberProjection, index): Member => {
    const isRunning = statuses.get(member.id)?.running ?? data.sessionById[member.id]?.running ?? false
    const status: MemberStatus = member.phase === 'failed' ? 'Done' : member.phase === 'provisioning' ? 'Idle' : isRunning ? 'Working' : 'Idle'
    const color = ['violet', 'blue', 'orange', 'green', 'pink'][index % 5]
    return {id:member.id,name:member.name,role:member.role==='lead'?'Team lead':'Agent teammate',initials:member.name.slice(0,2).toUpperCase(),color,status,task:member.error??(member.phase==='failed'?'Agent failed to start':isRunning?'Agent session is running':member.phase==='provisioning'?'Starting agent…':'Waiting / inactive'),progress:status==='Working'?55:status==='Done'?100:0,model:data.sessionById[member.id]?.cwd??'DSH session',branch:member.role==='lead'?'Team lead session':'Teammate session',lastActive:isRunning?'Running now':member.phase}
  }) ?? [], [data.sessionById, data.team, statuses])
  const tasks = data.team?.tasks ?? []
  const selectedMember = members.find((member) => member.id === selected)
  if (data.phase === 'pending' && !data.team) return <div className="live-empty"><Radio size={16}/>Đang đọc trạng thái Session từ DSH…</div>
  if (!data.team) return <div className="live-empty"><Bot size={20}/><div><strong>Chưa tìm thấy Agent Team trong Session này</strong><span>Mở cuộc trò chuyện Lead có Agent Team đang hoạt động. DSH chưa phát projection `agentTeam` cho Session hiện tại.</span></div></div>
  return <section className="live-team-view"><header className="live-team-header"><div><div className="eyebrow"><span className="eyebrow-line"/> DSH LIVE SESSION</div><h2>Đội Agent đang hoạt động</h2><p>{members.length} thành viên · {tasks.length} shared tasks · cập nhật từ DSH Session projection</p></div><span className="live-source-badge"><i/> LIVE DSH</span></header>{data.team.failure&&<div className="live-warning">Projection của Agent Team có lỗi: {data.team.failure}</div>}<div className="live-team-grid"><div className="live-office-canvas"><Canvas shadows camera={{position:[8,8,11],fov:43}} dpr={[1,1.5]}><color attach="background" args={['#11151b']}/><ambientLight intensity={1.2}/><directionalLight position={[-4,8,5]} intensity={2} castShadow/><pointLight position={[0,4,-3]} intensity={35} color="#7e74ff" distance={12}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.08,0]} receiveShadow><planeGeometry args={[12,10]}/><meshStandardMaterial color="#20242b"/></mesh><gridHelper args={[12,24,'#3a3e49','#282c34']} position={[0,-0.06,0]}/>{members.map((member,index)=><LiveDesk key={member.id} member={member} index={index} selected={selected===member.id} onSelect={()=>setSelected(member.id)}/>)}<ContactShadows position={[0,-0.055,0]} opacity={0.4} scale={14} blur={2.5} far={4}/><OrbitControls makeDefault minDistance={7} maxDistance={15} maxPolarAngle={Math.PI/2.05} target={[0,0.65,0]}/></Canvas><div className="live-canvas-caption">REAL DSH SESSIONS · CLICK A DESK TO INSPECT</div></div><aside className="live-team-roster"><h3>Member states</h3>{members.map((member)=><button className={`live-member-row ${selected===member.id?'is-selected':''}`} key={member.id} onClick={()=>setSelected(member.id)}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><span className="live-member-copy"><strong>{member.name}{member.role==='Team lead'?' · Lead':''}</strong><small>{member.task}</small></span><span className={`live-agent-dot ${member.status==='Working'?'is-running':''}`}/></button>)}<h3>Shared tasks</h3>{tasks.length?tasks.map((task)=><div className="live-task-row" key={task.id}><strong>{task.subject}</strong><small>{task.status.replace('_',' ')} · {task.ownerName??'Unassigned'}{task.ready?' · ready':' · blocked'}</small></div>):<p className="live-no-tasks">Chưa có shared tasks.</p>}{selectedMember&&<div className="live-selected-detail"><b>{selectedMember.name}</b><span>{selectedMember.status} · {selectedMember.role}</span></div>}</aside></div><div className="live-data-note">Trạng thái “đang chạy” lấy từ DSH Session runtime. Agent Team hiện chỉ xuất bản roster và shared tasks; chưa có event feed chi tiết cho từng hành động/công cụ, nên không mô phỏng giao việc/typing animation từ dữ liệu giả.</div></section>
}
