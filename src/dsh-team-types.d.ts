import '@deepseek-ai/dsh-experimental-agent-team/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

import '@deepseek-ai/dsh-client-ui-renderer/client'

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: import('@deepseek-ai/dsh-client-ui-renderer/client').SlotRegistry
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'conversation.view': {
      kind: 'list'
      scope: 'session'
      owner: {
        inspectCall: ((callId: string) => void) | undefined
        viewRequest: unknown
        openView: (view: string, focus: string) => void
        completeViewRequest: () => void
      }
    }
  }

  interface SessionStandardProps {
    useSessions: (selector: (state: {
      phase: 'pending' | 'ready'
      byId: Record<string, { running: boolean; cwd?: string }>
      projectionsBySession: Record<string, { values: { agentTeam?: import('@deepseek-ai/dsh-experimental-agent-team/client').TeamProjection } }>
    }) => unknown) => unknown
    useSessionStatus: (selector: (state: ReadonlyMap<string, import('@deepseek-ai/dsh-client-ui-session/client').SessionStatus>) => unknown) => unknown
  }

  interface SessionStandardProps {
    sessionId: SessionId
    useSession: (selector: (snapshot: { subagent?: { address?: { parentSessionId?: SessionId } }; openState?: string }) => unknown) => unknown
  }

  interface GlobalStandardProps {
    useSessions: (selector: (state: {
      phase: 'pending' | 'ready'
      byId: Record<string, { running: boolean; cwd?: string }>
      projectionsBySession: Record<string, { values: { agentTeam?: import('@deepseek-ai/dsh-experimental-agent-team/client').TeamProjection }; state: string }>
    }) => unknown) => unknown
    useSessionStatus: (selector: (state: ReadonlyMap<string, { running: boolean | undefined }>) => unknown) => unknown
  }
}
