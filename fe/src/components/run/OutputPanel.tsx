import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Activity, MousePointerClick } from 'lucide-react'
import { WorkflowRunState } from '../../hooks/useWorkflowRun'
import StepDetail from './StepDetail'

interface Props {
  state: WorkflowRunState
}

const OutputPanel: React.FC<Props> = ({ state }) => {
  const { steps, selectedStep, completed, error, globalState } = state
  const selected = steps.find(s => s.id === selectedStep)
  const failedSteps = steps.filter(s => s.status === 'error')

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minWidth: 0,
    }}>
      <div style={{
        padding: '0.625rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
          OUTPUT
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }} className="custom-scrollbar">
        <AnimatePresence mode="wait">
          {selected ? (
            <StepDetail key={selected.id} step={selected} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '2rem', gap: '0.75rem',
                border: '1.5px dashed rgba(255,255,255,0.07)',
                borderRadius: 14, color: 'var(--text-muted)',
                minHeight: 140,
              }}
            >
              <MousePointerClick size={26} strokeWidth={1.2} />
              <p style={{ textAlign: 'center', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
                Click any node to see output
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {Object.keys(globalState).length > 0 && (
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              padding: '0.6rem 0.875rem',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Activity size={12} color="var(--cyan)" />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Accumulated State</span>
            </div>
            <pre style={{
              margin: 0, padding: '0.75rem',
              background: 'rgba(0,0,0,0.35)',
              color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono',
              fontSize: '0.68rem', lineHeight: '1.75', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: 220, overflow: 'auto',
            }}>
              {JSON.stringify(globalState, null, 2)}
            </pre>
          </div>
        )}

        <AnimatePresence>
          {completed && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '0.875rem 1rem', borderRadius: 12,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', gap: '0.625rem',
              }}
            >
              <CheckCircle size={18} color="#10B981" />
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10B981', margin: '0 0 0.15rem' }}>Run Completed</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  {steps.filter(s => s.status === 'completed').length} of {steps.length} nodes executed
                </p>
              </div>
            </motion.div>
          )}
          {(error || failedSteps.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '0.875rem 1rem', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: failedSteps.length > 0 ? '0.625rem' : 0 }}>
                <XCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#EF4444', margin: '0 0 0.15rem' }}>
                    Run Failed
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'JetBrains Mono' }}>
                    {failedSteps.length} node{failedSteps.length !== 1 ? 's' : ''} failed
                    {steps.filter(s => s.status === 'completed').length > 0 && ` · ${steps.filter(s => s.status === 'completed').length} completed`}
                  </p>
                </div>
              </div>
              {failedSteps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: '1.625rem' }}>
                  {failedSteps.map(s => (
                    <div key={s.id} style={{
                      padding: '0.4rem 0.625rem', borderRadius: 7,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#FCA5A5', margin: '0 0 0.15rem', fontFamily: 'JetBrains Mono' }}>
                        {s.id}
                      </p>
                      {s.errorMessage && (
                        <p style={{ fontSize: '0.65rem', color: 'rgba(252,165,165,0.7)', margin: 0, lineHeight: 1.5 }}>
                          {s.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OutputPanel
