import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Settings, FileText, Zap, BarChart2, FileCheck,
  Cpu, Hash, GitBranch, Database, Search, Package,
} from 'lucide-react'
import { StepInfo, StepStatus } from '../types/run'
import { formatNodeLabel } from '../types/graph'
import { langgraphAPI } from '../services/langgraph'

const STEP_COLORS = [
  'var(--cyan)', 'var(--purple)', 'var(--orange)', 'var(--green)',
  'var(--pink)', 'var(--cyan)', 'var(--purple)', 'var(--orange)',
]
const STEP_ICONS = [
  Settings, FileText, Zap, BarChart2, FileCheck,
  Cpu, Hash, GitBranch, Database, Search, Package,
]

function buildStepFromNode(n: { id: string; type?: string }, i: number): StepInfo {
  const Icon = STEP_ICONS[i % STEP_ICONS.length]
  return {
    id: n.id,
    label: formatNodeLabel(n.id),
    desc: n.id.replace(/_/g, ' '),
    status: 'pending',
    icon: React.createElement(Icon, { size: 20 }),
    color: STEP_COLORS[i % STEP_COLORS.length],
  }
}

function buildDemoSequence(steps: StepInfo[], errorIdx?: number) {
  return steps.map(({ id }, i) => ({
    id,
    delay: 700 + i * 900,
    output: i === errorIdx
      ? { node: id, status: 'error', reason: 'Unexpected output schema — node failed validation' }
      : { node: id, status: 'ok', index: i },
    messages: i === errorIdx
      ? [`${formatNodeLabel(id)} started`, `${formatNodeLabel(id)} failed: validation error`]
      : [`${formatNodeLabel(id)} started`, `${formatNodeLabel(id)} completed`],
    isError: i === errorIdx,
  }))
}

function pickDemoErrorIdx(steps: StepInfo[]): number | undefined {
  if (steps.length < 3) return undefined
  // deterministically pick middle step as the error node for demo
  return Math.floor(steps.length / 2)
}

export interface WorkflowRunState {
  steps: StepInfo[]
  globalState: Record<string, unknown>
  completed: boolean
  error: string | null
  selectedStep: string | null
  elapsed: number
  stepMode: boolean
  demoStepIdx: number
  stepRunning: boolean
  isLive: boolean
  setSelectedStep: (id: string | null) => void
  toggleStepMode: () => void
  runNextStep: () => void
  markRunning: (id: string) => void
  markDone: (id: string, output: unknown, messages: string[]) => void
  markError: (id: string, msg: string) => void
}

export function useWorkflowRun(
  workflowId: string | undefined,
  threadId: string | null
): WorkflowRunState {
  const [steps, setSteps] = useState<StepInfo[]>([])
  const originalStepsRef = useRef<StepInfo[]>([])
  const [globalState, setGlobalState] = useState<Record<string, unknown>>({})
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [stepMode, setStepMode] = useState(false)
  const [demoStepIdx, setDemoStepIdx] = useState(0)
  const [stepRunning, setStepRunning] = useState(false)
  const isLiveRef = useRef(false)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const runningNodeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (completed) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [completed])

  const clearTimers = useCallback(() => {
    timerIds.current.forEach(clearTimeout)
    timerIds.current = []
    runningNodeTimers.current.forEach(clearTimeout)
    runningNodeTimers.current.clear()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markRunning = useCallback((id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'running' as StepStatus } : s))
    setSelectedStep(id)
  }, [])

  const markDone = useCallback((id: string, output: unknown, messages: string[]) => {
    const dur = Math.floor(Math.random() * 600 + 300)
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'completed' as StepStatus, output, messages, duration: dur } : s
    ))
    setGlobalState(prev => ({ ...prev, [id]: output }))
    setSelectedStep(id)
  }, [])

  const markError = useCallback((id: string, msg: string) => {
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'error' as StepStatus, errorMessage: msg } : s
    ))
    setGlobalState(prev => ({ ...prev, [id]: { error: true, message: msg } }))
    setSelectedStep(id)
    setError(msg)
  }, [])

  const runDemoSequence = useCallback((loadedSteps: StepInfo[], withError = false) => {
    const errIdx = withError ? pickDemoErrorIdx(loadedSteps) : undefined
    const seq = buildDemoSequence(loadedSteps, errIdx)
    let hasError = false
    seq.forEach(({ id, delay, output, messages, isError }) => {
      timerIds.current.push(setTimeout(() => markRunning(id), delay))
      if (isError) {
        hasError = true
        timerIds.current.push(setTimeout(() => {
          markError(id, (output as any).reason ?? 'Node failed')
        }, delay + 600))
      } else {
        timerIds.current.push(setTimeout(() => markDone(id, output, messages), delay + 600))
      }
    })
    const lastDelay = seq[seq.length - 1]?.delay ?? 0
    timerIds.current.push(setTimeout(() => {
      if (hasError) setError('Run stopped: one or more nodes failed')
      else setCompleted(true)
    }, lastDelay + 850))
  }, [markRunning, markDone, markError])

  const runLive = useCallback(async (loadedSteps: StepInfo[]): Promise<boolean> => {
    if (!threadId || !workflowId) return false
    const input = langgraphAPI.getRunInput(threadId)
    if (!input) return false
    try {
      for await (const { event, data } of langgraphAPI.streamRun(workflowId, threadId, input)) {
        if (event === 'updates' && data && typeof data === 'object') {
          const nodeNames = Object.keys(data).filter(k => k !== '__metadata__')
          for (const name of nodeNames) {
            const stepExists = loadedSteps.some(s => s.id === name)
            if (!stepExists) continue
            markRunning(name)
            const existing = runningNodeTimers.current.get(name)
            if (existing) clearTimeout(existing)
            const tid = setTimeout(() => {
              const nodeOutput = (data as any)[name]
              // detect soft-error flag emitted by the node
              if (nodeOutput?.node_failed) {
                const errMsg: string = nodeOutput.node_error_message ?? `Node '${name}' failed`
                markError(name, errMsg)
                runningNodeTimers.current.delete(name)
                return
              }
              const messages: string[] = []
              if (nodeOutput?.messages && Array.isArray(nodeOutput.messages)) {
                const msgs = nodeOutput.messages
                const last = msgs[msgs.length - 1]
                if (last?.content) messages.push(String(last.content))
              }
              markDone(name, nodeOutput, messages)
              runningNodeTimers.current.delete(name)
            }, 350)
            runningNodeTimers.current.set(name, tid)
          }
        }
        if (event === 'values' && data && typeof data === 'object') {
          setGlobalState(data as Record<string, unknown>)
        }
        if (event === 'error') {
          const errName = Object.keys(data ?? {}).find(k => k !== '__metadata__') ?? 'unknown'
          markError(errName, (data as any)?.message ?? 'Stream error')
          return true
        }
      }
      await new Promise(r => setTimeout(r, 400))
      setCompleted(true)
      langgraphAPI.clearRunInput(threadId)
      return true
    } catch {
      return false
    }
  }, [workflowId, threadId, markRunning, markDone, markError])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let loadedSteps: StepInfo[] = []
      try {
        const graph = await langgraphAPI.getGraphInfo(workflowId!)
        const realNodes = (graph.nodes ?? [])
          .filter((n: any) => n.id !== '__start__' && n.id !== '__end__')
        loadedSteps = realNodes.map((n: any, i: number) => buildStepFromNode(n, i))
      } catch { }
      if (cancelled) return
      setSteps(loadedSteps)
      originalStepsRef.current = loadedSteps

      const ok = await runLive(loadedSteps)
      if (ok) { isLiveRef.current = true; return }
      if (!cancelled) runDemoSequence(loadedSteps, true)
    })()
    return () => { cancelled = true; clearTimers() }
  }, [])

  const runNextStep = useCallback(() => {
    if (stepRunning || completed) return
    setSteps(current => {
      const pendingIdx = current.findIndex(s => s.status === 'pending')
      if (pendingIdx < 0) { setCompleted(true); return current }
      const step = current[pendingIdx]
      setStepRunning(true)
      markRunning(step.id)
      setTimeout(() => {
        markDone(step.id, { node: step.id, status: 'ok' }, [`${step.label} completed`])
        setStepRunning(false)
        setDemoStepIdx(pendingIdx + 1)
        const remaining = current.filter((s, i) => i > pendingIdx && s.status === 'pending')
        if (!remaining.length) setCompleted(true)
      }, 700)
      return current
    })
  }, [stepRunning, completed, markRunning, markDone])

  const toggleStepMode = useCallback(() => {
    if (isLiveRef.current) return
    clearTimers()
    const fresh = originalStepsRef.current.map(s => ({ ...s, status: 'pending' as StepStatus }))
    setSteps(fresh)
    setGlobalState({})
    setCompleted(false)
    setSelectedStep(null)
    setElapsed(0)
    setError(null)
    setDemoStepIdx(0)
    setStepRunning(false)
    setStepMode(m => {
      const next = !m
      if (!next) setTimeout(() => runDemoSequence(fresh, true), 50)
      return next
    })
  }, [clearTimers, runDemoSequence])

  return {
    steps,
    globalState,
    completed,
    error,
    selectedStep,
    elapsed,
    stepMode,
    demoStepIdx,
    stepRunning,
    isLive: isLiveRef.current,
    setSelectedStep,
    toggleStepMode,
    runNextStep,
    markRunning,
    markDone,
    markError,
  }
}
