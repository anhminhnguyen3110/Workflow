export type StepStatus = 'pending' | 'running' | 'completed' | 'error'

export interface StepInfo {
  id: string
  label: string
  desc: string
  status: StepStatus
  output?: unknown
  messages?: string[]
  errorMessage?: string
  duration?: number
  icon: React.ReactNode
  color: string
}

export interface RunInput {
  file_content: string
  file_name: string
  task: string
  priority: string
  [key: string]: unknown
}

export interface PendingApproval {
  nodeId: string
}
