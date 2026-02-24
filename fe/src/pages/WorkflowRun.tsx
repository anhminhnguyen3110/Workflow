import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, SkipForward, Play, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'
import { useWorkflowRun } from '../hooks/useWorkflowRun'
import { useSplitPane } from '../hooks/useSplitPane'
import PipelinePanel from '../components/run/PipelinePanel'
import OutputPanel from '../components/run/OutputPanel'
import DragDivider from '../components/ui/DragDivider'
import { langgraphAPI } from '../services/langgraph'

const WorkflowRun: React.FC = () => {
  const { workflowId, runId } = useParams<{ workflowId: string; runId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const threadId = searchParams.get('threadId')
  const [workflowName, setWorkflowName] = useState('')

  const state = useWorkflowRun(workflowId, threadId)
  const { splitPct, onDividerMouseDown } = useSplitPane(38)

  useEffect(() => {
    if (!workflowId) return
    langgraphAPI.getAssistant(workflowId)
      .then((a: any) => {
        const raw = a?.name || a?.graph_id || workflowId!
        setWorkflowName(raw.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
      })
      .catch(() => setWorkflowName(workflowId!))
  }, [workflowId])

  const fmtElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
  const failedCount = state.steps.filter(s => s.status === 'error').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Back button — same row style as WorkflowDetail */}
      <motion.button
        className="btn-ghost"
        onClick={() => navigate(`/workflows/${workflowId}`)}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ padding: '0.4rem 0', marginBottom: '1.125rem', gap: '0.4rem', alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={14} /> Back to Workflow
      </motion.button>

      {/* Header — icon + title + stats + action, matching WorkflowDetail */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexShrink: 0 }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(59,130,246,0.25))',
          border: '1.5px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={17} color="#34D399" fill="#34D399" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {workflowName || '—'}
            </h1>
            {state.completed && !state.error && failedCount === 0 && (
              <span style={{
                fontSize: '0.6rem', fontWeight: '700', color: '#10B981',
                padding: '0.15rem 0.45rem', borderRadius: 4,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              }}>DONE</span>
            )}
            {(state.error || failedCount > 0) && (
              <span style={{
                fontSize: '0.6rem', fontWeight: '700', color: '#EF4444',
                padding: '0.15rem 0.45rem', borderRadius: 4,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              }}>ERROR</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {state.steps.length} steps · Pipeline
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={9} /> {fmtElapsed(state.elapsed)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {state.steps.filter(s => s.status === 'completed').length}/{state.steps.length} nodes
            </span>
            {failedCount > 0 && (
              <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: '600' }}>
                · {failedCount} failed
              </span>
            )}
          </div>
        </div>

        <button
          onClick={state.toggleStepMode}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: '700',
            background: state.stepMode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            color: state.stepMode ? '#818CF8' : 'var(--text-secondary)',
            border: `1px solid ${state.stepMode ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {state.stepMode ? <><SkipForward size={11} /> Step Mode</> : <><Play size={11} fill="currentColor" /> Auto</>}
        </button>
      </motion.div>

      {/* HITL Approval Banner */}
      <AnimatePresence>
        {state.pendingApproval && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            style={{
              marginBottom: '0.875rem',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
              border: '1.5px solid rgba(245,158,11,0.4)',
              padding: '0.875rem 1.125rem',
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="#F59E0B" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F59E0B', margin: '0 0 0.2rem' }}>
                Human Review Required
              </p>
              <p style={{ fontSize: '0.68rem', color: 'rgba(245,158,11,0.7)', margin: 0, fontFamily: 'JetBrains Mono' }}>
                Paused before: <span style={{ color: '#F59E0B' }}>{state.pendingApproval.nodeId}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                onClick={state.rejectStep}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.875rem', borderRadius: 8,
                  fontSize: '0.72rem', fontWeight: '700',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                  color: '#EF4444', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <XCircle size={12} /> Reject
              </button>
              <button
                onClick={state.approveStep}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.875rem', borderRadius: 8,
                  fontSize: '0.72rem', fontWeight: '700',
                  background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.45)',
                  color: '#F59E0B', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <CheckCircle size={12} /> Approve & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div style={{
          width: `${splitPct}%`, flexShrink: 0, overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          <PipelinePanel state={state} />
        </div>

        <DragDivider onMouseDown={onDividerMouseDown} />

        <OutputPanel state={state} />
      </div>
    </div>
  )
}

export default WorkflowRun
