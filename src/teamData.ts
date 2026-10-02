export type MemberStatus = 'Working' | 'Reviewing' | 'Idle' | 'Done' | 'Delivering'

export type Member = {
  id: string
  name: string
  role: string
  initials: string
  color: string
  status: MemberStatus
  task: string
  progress: number
  model: string
  branch: string
  lastActive: string
}
