import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Code2, GitBranch, CheckCircle, Loader2, Clock, AlertCircle, AlertTriangle } from 'lucide-react'
import { StepInfo } from '../../types/run'

interface Props {
  step: StepInfo
}

type Tab = 'output' | 'messages' | 'error'

const StatusBadge: React.FC<{ status: StepInfo['status'] }> = ({ status }) => {
  const map = {
    pending: { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', Icon: Clock, label: 'Pending' },
    running: { color: '#818CF8', bg: 'rgba(99,102,241,0.15)', Icon: Loader2, label: 'Running' },
    completed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle, label: 'Completed' },
    error: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', Icon: AlertCircle, label: 'Error' },
  }
  const { color, bg, Icon, label } = map[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.22rem 0.55rem', borderRadius: 20, fontSize: '0.63rem', fontWeight: '700',
      background: bg, color, border: `1px solid ${color}40`,
    }}>
      <Icon size={9} className={status === 'running' ? 'animate-spin' : ''} />
      {label}
    </span>
  )
}

const StepDetail: React.FC<Props> = ({ step }) => {
  const [tab, setTab] = useState<Tab>(step.status === 'error' ? 'error' : 'output')

  const tabs: { id: Tab; label: string; Icon: React.FC<any>; hidden?: boolean }[] = [
    { id: 'output', label: 'Output', Icon: Code2 },
    { id: 'messages', label: 'Messages', Icon: MessageSquare },
    { id: 'error', label: 'Error', Icon: AlertTriangle, hidden: step.status !== 'error' },
  ]

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}
    >
      <div style={{
        padding: '0.875rem 1rem',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: `${step.color}18`, border: `1.5px solid ${step.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color,
        }}>
          {step.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{step.label}</span>
            <StatusBadge status={step.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{step.id}</span>
            {step.duration && (
              <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <GitBranch size={9} />
                {step.duration}ms
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.filter(t => !t.hidden).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '0.5rem', fontSize: '0.72rem', fontWeight: '600',
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === id
                ? (id === 'error' ? '#EF4444' : 'var(--text-primary)')
                : 'var(--text-muted)',
              borderBottom: `2px solid ${
                tab === id
                  ? (id === 'error' ? 'rgba(239,68,68,0.8)' : 'rgba(99,102,241,0.8)')
                  : 'transparent'
              }`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={11} />
            {label}
            {id === 'error' && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#EF4444',
                display: 'inline-block', flexShrink: 0,
              }} />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ padding: '0.875rem', minHeight: 80 }}
        >
          {tab === 'output' && (
            step.output
              ? <pre style={{
                  margin: 0, padding: '0.75rem',
                  background: 'rgba(0,0,0,0.35)', borderRadius: 8,
                  color: step.status === 'error' ? '#FCA5A5' : 'var(--cyan)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.72rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              : <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', margin: '1rem 0' }}>
                  {step.status === 'pending' ? 'Node has not run yet' : step.status === 'running' ? 'Running...' : step.status === 'error' ? 'No output — node errored' : 'No output captured'}
                </p>
          )}
          {tab === 'messages' && (
            step.messages && step.messages.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {step.messages.map((msg, i) => (
                    <div key={i} style={{
                      padding: '0.5rem 0.75rem', borderRadius: 8,
                      background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
                      fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                    }}>{msg}</div>
                  ))}
                </div>
              : <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', margin: '1rem 0' }}>No messages</p>
          )}
          {tab === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{
                padding: '0.75rem 0.875rem', borderRadius: 9,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              }}>
                <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#EF4444', margin: '0 0 0.3rem' }}>Node Failed</p>
                  <p style={{
                    fontSize: '0.72rem', color: '#FCA5A5', margin: 0,
                    fontFamily: 'JetBrains Mono', lineHeight: 1.75,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {step.errorMessage ?? 'Unknown error'}
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'JetBrains Mono' }}>
                  node: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{step.id}</span>
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.25rem 0 0', fontFamily: 'JetBrains Mono' }}>
                  status: <span style={{ color: '#EF4444' }}>error</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default StepDetail
