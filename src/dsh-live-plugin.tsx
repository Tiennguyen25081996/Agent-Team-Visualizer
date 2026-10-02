import type { Context } from '@deepseek-ai/cordis'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { LiveTeamOffice } from './dsh-live-entry'
import type {} from './dsh-team-types.d.ts'
import './dsh-live.css'

function LiveTeamView(props: ConvViewProps) {
  return <div className="dsh-live-team-host"><LiveTeamOffice {...props}/></div>
}

// `inject` must be a plain array of service names. cordis's Inject.resolve()
// only understands arrays or plain objects, so exporting a function here
// resolves to zero services, leaves ctx.slots undefined in apply(), and the
// entry's fiber ends up disposed ("...: failed" in the web boot audit).
export const inject = ['slots']

export function apply(ctx: Context) {
  ctx.slots.inject('conversation.view', () => ctx.slots.register({ name: 'conversation.view', id: 'agent-team-visualizer', label: 'Live Team', order: 20 }, LiveTeamView))
}
