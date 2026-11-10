export type AgentTrack = {
  id: string
  description: string
  type: string
  startedAt: number
  endedAt?: number
  tools: number
  lastTool?: string
  touch?: string
}

declare module 'claude-code' {
  interface PluginState {
    'agent-status': { tracks: Shaped<AgentTrack[]> }
  }
}
