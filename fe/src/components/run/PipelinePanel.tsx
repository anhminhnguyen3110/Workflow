import React, { useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, ChevronRight, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import TerminalNode from '../shared/TerminalNode'
import VerticalNode from './VerticalNode'
import VerticalConnector from './VerticalConnector'
import { WorkflowRunState } from '../../hooks/useWorkflowRun'

interface Props {
  state: WorkflowRunState
}

const PipelinePanel: React.FC<Props> = ({ state }) => {
  const { steps, selectedStep, stepMode, demoStepIdx, stepRunning, isLive } = state
  const listRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = React.useState(1)

  const selectedIdx = steps.findIndex(s => s.id === selectedStep)
  const errorCount = steps.filter(s => s.status === 'error').length

  useEffect(() => {
    if (selectedStep && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${selectedStep}"]`) as HTMLElement | null
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedStep])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            PIPELINE
          </span>
          {isLive && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                fontSize: '0.6rem', fontWeight: '700', color: '#10B981',
                padding: '0.12rem 0.4rem', borderRadius: 4,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              }}
            >LIVE</motion.span>
          )}
          {!isLive && (
            <span style={{
              fontSize: '0.6rem', fontWeight: '600', color: 'var(--purple)',
              padding: '0.12rem 0.4rem', borderRadius: 4,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
            }}>DEMO</span>
          )}
          {errorCount > 0 && (
            <span style={{
              fontSize: '0.6rem', fontWeight: '700', color: '#EF4444',
              padding: '0.12rem 0.45rem', borderRadius: 4,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <AlertTriangle size={9} />
              {errorCount} ERR
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { Icon: ZoomOut, onClick: () => setZoom(z => Math.max(0.6, z - 0.1)) },
            { Icon: Maximize2, onClick: () => setZoom(1) },
            { Icon: ZoomIn, onClick: () => setZoom(z => Math.min(1.4, z + 0.1)) },
          ].map(({ Icon, onClick }, i) => (
            <button key={i} onClick={onClick} style={{
              width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {stepMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 1rem',
          background: 'rgba(99,102,241,0.06)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Step {demoStepIdx + 1} / {steps.length}
          </span>
          <button
            onClick={state.runNextStep}
            disabled={stepRunning || demoStepIdx >= steps.length}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: '700',
              background: stepRunning ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.2)',
              color: stepRunning ? 'var(--text-muted)' : '#818CF8',
              border: '1px solid rgba(99,102,241,0.3)', cursor: stepRunning ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={12} />
            {stepRunning ? 'Running...' : 'Next Step'}
          </button>
        </div>
      )}

      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0,
        }}
        className="custom-scrollbar"
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
          <TerminalNode type="start" />

          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <VerticalConnector
                fromStatus={i === 0 ? 'completed' : steps[i - 1].status}
                toStatus={step.status}
              />
              <div data-id={step.id}>
                <VerticalNode
                  step={step}
                  selected={selectedStep === step.id}
                  onClick={() => state.setSelectedStep(step.id)}
                />
              </div>
              {i === selectedIdx && selectedIdx < steps.length - 1 && (
                <div style={{
                  width: '100%', height: 2,
                  background: 'rgba(99,102,241,0.12)',
                  margin: '2px 0',
                  borderRadius: 1,
                }} />
              )}
            </React.Fragment>
          ))}

          {steps.length > 0 && (
            <VerticalConnector
              fromStatus={steps[steps.length - 1].status}
              toStatus="pending"
            />
          )}
          <TerminalNode type="end" />
        </div>
      </div>
    </div>
  )
}

export default PipelinePanel
