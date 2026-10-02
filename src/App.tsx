import { lazy, Suspense, useMemo, useState } from 'react'
const OfficeScene = lazy(() => import('./OfficeScene'))
import type { Member, MemberStatus } from './teamData'
import './office.css'
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bot, Check, CheckCircle2, ChevronDown, Circle, Clock3, Command,
  Filter, GitBranch, GitCommitHorizontal, LayoutDashboard, ListTodo,
  MoreHorizontal, Play, Plus, Radio, Search, Settings2, ShieldCheck,
  Sparkles, Users, X,
} from 'lucide-react'
import './App.css'

type Task = { id: string; title: string; owner: string; status: 'In progress' | 'In review' | 'Done' | 'Todo'; priority: 'High' | 'Medium' | 'Low'; time: string }
type FeedItem = { id: string; member: string; action: string; target: string; time: string; kind: 'commit' | 'review' | 'task' | 'message'; color: string }

const initialMembers: Member[] = [
  { id: 'lead', name: 'Lead', role: 'Team coordinator', initials: 'L', color: 'violet', status: 'Working', task: 'Coordinating Phase 4 delivery', progress: 74, model: 'Gemma 4 · 31B', branch: 'feature/phase4-ui', lastActive: 'Just now' },
  { id: 'core', name: 'core-dev', role: 'Gameplay systems', initials: 'CD', color: 'blue', status: 'Done', task: 'SelectionManager + SetCombatTarget', progress: 100, model: 'Muse Spark 1.3', branch: 'feature/phase4-ui', lastActive: '4m ago' },
  { id: 'ui', name: 'ui-dev', role: 'UI developer', initials: 'UI', color: 'orange', status: 'Reviewing', task: 'Resource, spawn & building panels', progress: 86, model: 'Muse Spark 1.3', branch: 'feature/phase4-ui', lastActive: '1m ago' },
  { id: 'qa', name: 'review-qa', role: 'Adversarial QA', initials: 'QA', color: 'green', status: 'Working', task: 'Phase 4 adversarial review', progress: 68, model: 'Muse Spark 1.3', branch: 'feature/phase4-ui', lastActive: 'Just now' },
  { id: 'support', name: 'support-dev', role: 'Support developer', initials: 'SD', color: 'pink', status: 'Idle', task: 'Waiting for next assignment', progress: 100, model: 'Muse Spark 1.3', branch: 'feature/phase4-ui', lastActive: '12m ago' },
]

const initialTasks: Task[] = [
  { id: 'T-18', title: 'Build selection manager', owner: 'core', status: 'Done', priority: 'High', time: '10:24' },
  { id: 'T-19', title: 'Add combat retarget API', owner: 'core', status: 'Done', priority: 'High', time: '10:38' },
  { id: 'T-20', title: 'Create resource & spawn panels', owner: 'ui', status: 'Done', priority: 'Medium', time: '10:42' },
  { id: 'T-21', title: 'Build placement & selection UI', owner: 'ui', status: 'In review', priority: 'High', time: '10:45' },
  { id: 'T-22', title: 'Implement UnitCommander orders', owner: 'support', status: 'Done', priority: 'Medium', time: '10:45' },
  { id: 'T-23', title: 'Run adversarial review', owner: 'qa', status: 'In progress', priority: 'High', time: '10:51' },
  { id: 'T-24', title: 'Close Santa review blockers', owner: 'core', status: 'Done', priority: 'High', time: '11:08' },
  { id: 'T-25', title: 'Independent Santa verification', owner: 'qa', status: 'In progress', priority: 'High', time: '11:12' },
]

const feed: FeedItem[] = [
  { id: 'f1', member: 'review-qa', action: 'reported', target: 'Santa round 2: 2 blockers found', time: '11:12:08', kind: 'review', color: 'green' },
  { id: 'f2', member: 'core-dev', action: 'committed', target: 'fix: close blockers B1 + B2', time: '11:08:41', kind: 'commit', color: 'blue' },
  { id: 'f3', member: 'support-dev', action: 'completed', target: 'UnitCommander + peer review', time: '10:54:22', kind: 'task', color: 'pink' },
  { id: 'f4', member: 'review-qa', action: 'approved', target: 'Phase 4 adversarial review · PASS', time: '10:51:36', kind: 'review', color: 'green' },
  { id: 'f5', member: 'core-dev', action: 'reviewed', target: '4 UI panels · peer verdict OK', time: '10:48:02', kind: 'review', color: 'blue' },
  { id: 'f6', member: 'ui-dev', action: 'completed', target: 'BuildPanel + SelectionPanel', time: '10:45:19', kind: 'task', color: 'orange' },
  { id: 'f7', member: 'ui-dev', action: 'completed', target: 'ResourceBar + SpawnPanel', time: '10:42:03', kind: 'task', color: 'orange' },
  { id: 'f8', member: 'core-dev', action: 'committed', target: 'feat: SelectionManager + SetCombatTarget', time: '10:38:51', kind: 'commit', color: 'blue' },
  { id: 'f9', member: 'support-dev', action: 'reviewed', target: 'SelectionManager · peer verdict OK', time: '10:34:16', kind: 'review', color: 'pink' },
]

const statusClass: Record<MemberStatus, string> = { Working: 'working', Reviewing: 'reviewing', Idle: 'idle', Done: 'done', Delivering: 'delivering' }
const taskStatusClass: Record<Task['status'], string> = { 'In progress': 'progress', 'In review': 'review', Done: 'complete', Todo: 'todo' }

function App() {
  const [members, setMembers] = useState(initialMembers)
  const [tasks] = useState(initialTasks)
  const [selectedMember, setSelectedMember] = useState<string | null>('qa')
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All activity')
  const [showAll, setShowAll] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const [toast, setToast] = useState('')
  const [currentView, setCurrentView] = useState<'overview' | 'office'>('office')
  const selected = members.find((member) => member.id === selectedMember)

  const filteredFeed = useMemo(() => feed.filter((item) => {
    const matchesQuery = `${item.member} ${item.action} ${item.target}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = activeFilter === 'All activity' || (activeFilter === 'Reviews' && item.kind === 'review') || (activeFilter === 'Commits' && item.kind === 'commit') || (activeFilter === 'Tasks' && item.kind === 'task')
    return matchesQuery && matchesFilter
  }), [activeFilter, query])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const toggleMember = (id: string) => {
    setMembers((current) => current.map((member) => member.id === id ? { ...member, status: member.status === 'Idle' ? 'Working' : 'Idle', lastActive: 'Just now' } : member))
  }

  const cycleMemberStatus = (id: string) => {
    const sequence: MemberStatus[] = ['Working', 'Delivering', 'Reviewing', 'Idle']
    setMembers((current) => current.map((member) => {
      if (member.id !== id) return member
      const next = sequence[(sequence.indexOf(member.status) + 1) % sequence.length]
      return { ...member, status: next, lastActive: 'Just now' }
    }))
  }

  const doneCount = tasks.filter((task) => task.status === 'Done').length
  const activeCount = members.filter((member) => member.status === 'Working' || member.status === 'Reviewing').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Command size={18} strokeWidth={2.4} /></div><span>orbit<span className="brand-dot">.</span></span><span className="brand-tag">BETA</span></div>
        <div className="workspace-switch"><div className="workspace-icon">TS</div><div className="workspace-copy"><strong>TinySword Studio</strong><span>Personal workspace</span></div><ChevronDown size={15} /></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="nav-list">
          <button className={`nav-item ${currentView === 'overview' ? 'active' : ''}`} onClick={() => setCurrentView('overview')}><LayoutDashboard size={17} /><span>Overview</span><span className="nav-shortcut">⌘ 1</span></button>
          <button className={`nav-item ${currentView === 'office' ? 'active' : ''}`} onClick={() => setCurrentView('office')}><Bot size={17} /><span>3D Office</span><span className="nav-count">{members.length}</span></button>
          <button className="nav-item" onClick={() => notify('Task board is shown in the overview')}><ListTodo size={17} /><span>Task board</span><span className="nav-count">8</span></button>
          <button className="nav-item" onClick={() => notify('Activity feed is shown in the overview')}><Activity size={17} /><span>Activity</span></button>
          <button className="nav-item" onClick={() => notify('Members are listed below')}><Users size={17} /><span>Members</span><span className="nav-count">5</span></button>
        </nav>
        <div className="sidebar-label team-label">YOUR TEAM <button title="Invite member" onClick={() => notify('Demo mode: invitations are disabled')}><Plus size={15} /></button></div>
        <div className="sidebar-team">
          {members.map((member) => <button className={`team-person ${selectedMember === member.id ? 'selected' : ''}`} key={member.id} onClick={() => setSelectedMember(member.id)}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><span className="team-person-name">{member.name}</span><span className={`presence presence-${statusClass[member.status]}`} /></button>)}
        </div>
        <div className="sidebar-bottom"><button className="nav-item" onClick={() => notify('Settings are not available in demo mode')}><Settings2 size={17} /><span>Settings</span></button><div className="user-profile"><div className="user-avatar">TN</div><div className="user-copy"><strong>Tien Nguyen</strong><span>Workspace owner</span></div><MoreHorizontal size={18} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div><div className="top-actions"><div className="branch-pill"><GitBranch size={14} /><span>feature/phase4-ui</span><ChevronDown size={13} /></div><button className="icon-button" title="Search" onClick={() => document.getElementById('activity-search')?.focus()}><Search size={17} /></button><button className="help-button" onClick={() => notify('Demo dashboard · data is illustrative')}>?</button><div className="top-avatar">TN</div></div></header>

        <div className="page-content">
          {currentView === 'office' ? <>
            <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> AGENT OPERATIONS FLOOR</div><h1>Your team, in motion <span className="wave">✳</span></h1><p className="page-subtitle">Watch agents work, collaborate, and deliver tasks in their shared office.</p></div><div className="office-header-actions"><span className="demo-state-label"><span className="live-dot" /> DEMO SCENE</span><button className="primary-button" onClick={() => { const next = members.find(member => member.status !== 'Delivering'); if (next) { cycleMemberStatus(next.id); notify(`${next.name} is heading to deliver a task`) } }}><Play size={14} fill="currentColor" /> Simulate delivery</button></div></section>
            <section className="office-toolbar"><div className="office-legend"><span><i className="legend-working"/>Working</span><span><i className="legend-review"/>Reviewing</span><span><i className="legend-delivering"/>Delivering</span><span><i className="legend-idle"/>Idle / done</span></div><div className="office-toolbar-note"><span>Drag to orbit</span><span className="toolbar-separator">·</span><span>Scroll to zoom</span><button onClick={() => setMembers(current => current.map(member => member.status === 'Delivering' ? { ...member, status: 'Working' } : member))}>Reset scene</button></div></section>
            <section className="office-layout"><div className="office-stage"><Suspense fallback={<div className="scene-loading"><span className="loading-orbit"/>Loading 3D office…</div>}><OfficeScene members={members} selectedId={selectedMember} onSelectMember={setSelectedMember}/></Suspense><div className="scene-caption"><span><span className="scene-caption-dot"/> FLOOR 01</span><span>5 WORKSTATIONS · INTERACTIVE SCENE</span></div></div><aside className="office-roster"><div className="roster-heading"><div><h3>Team floor</h3><p>{members.length} dedicated workstations</p></div><span className="roster-live"><Radio size={13}/> LIVE</span></div>{members.map(member => <div key={member.id} className={`roster-card ${selectedMember === member.id ? 'roster-selected' : ''}`}><button className="roster-main" onClick={() => setSelectedMember(member.id)}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><span className="roster-info"><strong>{member.name}</strong><small>{member.task}</small></span><span className={`status-pill status-${statusClass[member.status]}`}><i/>{member.status}</span></button><div className="roster-meta"><span><Bot size={11}/>{member.model}</span><span><GitBranch size={11}/>{member.branch}</span></div><div className="roster-actions"><span className="roster-last-active"><Clock3 size={11}/>{member.lastActive}</span><button onClick={() => cycleMemberStatus(member.id)} title="Cycle demo member state"><Activity size={12}/> Change state</button></div></div>)}<div className="office-note"><Sparkles size={14}/><span>Scene uses sample data. Switch an agent to <b>Delivering</b> to see them walk around the floor.</span></div></aside></section>
            <footer className="page-footer"><span><span className="footer-status"/> Scene rendering locally</span><span>Orbit controls enabled · Click a workstation to select</span><span>Data source: demo <Sparkles size={12}/></span></footer>
          </> : <>
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> TEAM CONTROL CENTER</div><h1>Good morning, Tien <span className="wave">✳</span></h1><p className="page-subtitle">Here’s what your agents are working on today.</p></div><button className="primary-button" onClick={() => notify('Demo mode: new task creation is disabled')}><Plus size={16} /> New task</button></section>

          <section className="stat-grid" aria-label="Team summary">
            <article className="stat-card"><div className="stat-top"><span>Active members</span><span className="stat-icon purple"><Users size={16} /></span></div><div className="stat-value">{activeCount}<span className="stat-total"> / {members.length}</span><span className="stat-change positive"><ArrowUpRight size={14} /> +2</span></div><div className="stat-foot"><div className="avatar-stack">{members.filter(m => m.status === 'Working' || m.status === 'Reviewing').map(m => <span key={m.id} className={`avatar avatar-${m.color}`}>{m.initials}</span>)}</div><span>agents online now</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Tasks completed</span><span className="stat-icon green"><CheckCircle2 size={16} /></span></div><div className="stat-value">{doneCount}<span className="stat-total"> / {tasks.length}</span><span className="stat-change positive"><ArrowUpRight size={14} /> 24%</span></div><div className="stat-progress"><span style={{ width: `${doneCount / tasks.length * 100}%` }} /></div><div className="stat-foot"><span>Overall sprint progress</span><strong>{Math.round(doneCount / tasks.length * 100)}%</strong></div></article>
            <article className="stat-card"><div className="stat-top"><span>Review queue</span><span className="stat-icon orange"><ShieldCheck size={16} /></span></div><div className="stat-value">{tasks.filter(t => t.status === 'In review').length}<span className="stat-total"> tasks</span><span className="stat-change neutral"><ArrowDownRight size={14} /> -1</span></div><div className="stat-foot"><span className="queue-dot" /> <span>Peer review in progress</span><span className="queue-link" onClick={() => setActiveFilter('Reviews')}>View queue <ArrowRight size={12} /></span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Avg. response time</span><span className="stat-icon blue"><Clock3 size={16} /></span></div><div className="stat-value">1.8<span className="stat-unit">m</span><span className="stat-change positive"><ArrowDownRight size={14} /> 12%</span></div><div className="stat-foot"><span>Across all team members</span><span className="tiny-sparkline"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
          </section>

          <section className="section-heading"><div><h2>Team activity</h2><p>Live updates from your agent workspace</p></div><div className="live-control"><span className={`live-dot ${isLive ? '' : 'paused'}`} /><span>{isLive ? 'Live' : 'Paused'}</span><button aria-label={isLive ? 'Pause live updates' : 'Resume live updates'} onClick={() => setIsLive(!isLive)}>{isLive ? <span className="pause-icon">Ⅱ</span> : <Play size={12} fill="currentColor" />}</button></div></section>

          <section className="dashboard-grid">
            <div className="panel activity-panel"><div className="panel-header activity-header"><div className="filter-tabs">{['All activity', 'Tasks', 'Reviews', 'Commits'].map(filter => <button key={filter} className={activeFilter === filter ? 'filter-active' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div><div className="activity-tools"><label className="search-box"><Search size={14} /><input id="activity-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search activity..." /></label><button className="subtle-icon" title="Filter activity" onClick={() => setActiveFilter(activeFilter === 'All activity' ? 'Tasks' : 'All activity')}><Filter size={15} /></button><button className="subtle-icon" title="More activity options" onClick={() => setShowAll(!showAll)}><MoreHorizontal size={17} /></button></div></div>
              <div className="feed-list">{filteredFeed.slice(0, showAll ? 9 : 6).map((item, index) => { const member = members.find(m => m.name === item.member); return <div className="feed-item" key={item.id}><div className="feed-rail"><span className={`feed-icon feed-${item.kind}`}>{item.kind === 'commit' ? <GitCommitHorizontal size={15} /> : item.kind === 'review' ? <ShieldCheck size={14} /> : item.kind === 'task' ? <Check size={14} /> : <Radio size={14} />}</span>{index !== Math.min(filteredFeed.length, showAll ? 9 : 6) - 1 && <span className="rail-line" />}</div><span className={`avatar avatar-${member?.color ?? item.color}`}>{member?.initials ?? 'AI'}</span><div className="feed-copy"><div><strong>{item.member}</strong> <span>{item.action}</span> <b>{item.target}</b></div><small>{item.kind === 'commit' ? <><GitCommitHorizontal size={11} /> {item.time} · <code>{item.id === 'f2' ? '678a70f' : '979a353'}</code></> : <><Clock3 size={11} /> {item.time} ago</>}</small></div><button className="feed-more" aria-label="Activity options" onClick={() => notify(`Activity by ${item.member}`)}><MoreHorizontal size={16} /></button></div> })}{filteredFeed.length === 0 && <div className="empty-state"><Search size={20} /><span>No activity matches your search.</span></div>}</div>
              <button className="panel-footer-link" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less activity' : 'View all activity'} <ArrowRight size={14} /></button>
            </div>

            <div className="panel members-panel"><div className="panel-header"><div><h3>Team members <span className="soft-count">{members.length}</span></h3><p>Agent status at a glance</p></div><button className="subtle-icon" onClick={() => notify('Member settings are not available in demo mode')}><MoreHorizontal size={17} /></button></div><div className="member-list">{members.map(member => <button key={member.id} className={`member-card ${selectedMember === member.id ? 'member-selected' : ''}`} onClick={() => setSelectedMember(member.id)}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><span className="member-info"><strong>{member.name}</strong><small>{member.role}</small></span><span className={`status-pill status-${statusClass[member.status]}`}><i />{member.status}</span></button>)}</div><button className="panel-footer-link" onClick={() => setSelectedMember(null)}>View all members <ArrowRight size={14} /></button></div>
          </section>

          <section className="lower-grid"><div className="panel task-panel"><div className="panel-header"><div><h3>Task board <span className="soft-count">{tasks.length}</span></h3><p>Phase 4 · UI system</p></div><button className="board-link" onClick={() => notify('Full task board is coming soon')}>Open board <ArrowRight size={13} /></button></div><div className="task-table"><div className="task-row task-head"><span>Task</span><span>Assignee</span><span>Priority</span><span>Status</span></div>{tasks.slice(0, 5).map(task => <button className="task-row" key={task.id} onClick={() => notify(`${task.id}: ${task.title}`)}><span className="task-title"><span className={`task-check ${task.status === 'Done' ? 'checked' : ''}`}>{task.status === 'Done' && <Check size={10} />}</span><span><small>{task.id}</small>{task.title}</span></span><span className="task-assignee"><span className={`avatar avatar-${members.find(m => m.id === task.owner)?.color}`}>{members.find(m => m.id === task.owner)?.initials}</span>{members.find(m => m.id === task.owner)?.name}</span><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span><span><span className={`task-status status-${taskStatusClass[task.status]}`}>{task.status}</span></span></button>)}</div><button className="panel-footer-link" onClick={() => notify('Showing a sample of the current sprint')}>View all tasks <ArrowRight size={14} /></button></div>

            <div className="panel detail-panel"><div className="panel-header"><div><h3>Member details</h3><p>{selected ? 'Selected agent profile' : 'Choose a member to inspect'}</p></div><button className="subtle-icon" onClick={() => setSelectedMember(null)} title="Clear selection"><X size={15} /></button></div>{selected ? <><div className="detail-person"><span className={`avatar avatar-xl avatar-${selected.color}`}>{selected.initials}</span><div><h4>{selected.name}</h4><span>{selected.role}</span></div><span className={`status-pill status-${statusClass[selected.status]}`}><i />{selected.status}</span></div><div className="detail-current"><span className="detail-label">CURRENT TASK</span><strong>{selected.task}</strong><div className="detail-progress"><span style={{ width: `${selected.progress}%` }} /></div><div className="progress-meta"><span>{selected.progress}% complete</span><span>{selected.status === 'Done' ? 'Completed' : 'Updated ' + selected.lastActive}</span></div></div><div className="detail-meta"><div><span>MODEL</span><strong><Bot size={13} /> {selected.model}</strong></div><div><span>BRANCH</span><strong><GitBranch size={13} /> {selected.branch}</strong></div></div><div className="detail-actions"><button onClick={() => notify(`Opening ${selected.name} activity`)}><Activity size={14} /> View activity</button><button className="more-action" title={selected.status === 'Idle' ? 'Activate member' : 'Pause member'} onClick={() => toggleMember(selected.id)}>{selected.status === 'Idle' ? <Play size={14} /> : <Circle size={14} />}</button></div></> : <div className="detail-empty"><Users size={24} /><span>Select a team member to see their current task, model and branch.</span></div>}</div></section>

          <footer className="page-footer"><span><span className="footer-status" /> All systems operational</span><span>Demo data · Last synced just now</span><span>Built for agent teams <Sparkles size={12} /></span></footer>
          </>}
        </div>
      </main>
      {toast && <div className="toast"><AlertCircle size={16} />{toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}
    </div>
  )
}

export default App
