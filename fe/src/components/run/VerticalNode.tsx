import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, Clock, AlertCircle } from 'lucide-react'
import { StepInfo } from '../../types/run'

interface Props {
  step: StepInfo
  selected: boolean
  onClick: () => void
}

const statusColors: Record<string, string> = {
  pending: 'rgba(255,255,255,0.08)',
  running: 'rgba(99,102,241,0.18)',
  completed: 'rgba(16,185,129,0.12)',
  error: 'rgba(239,68,68,0.12)',
}

const statusBorder: Record<string, string> = {
  pending: 'rgba(255,255,255,0.1)',
  running: 'rgba(99,102,241,0.5)',
  completed: 'rgba(16,185,129,0.4)',
  error: 'rgba(239,68,68,0.4)',
}

const StatusIcon: React.FC<{ step: StepInfo }> = ({ step }) => {
  if (step.status === 'running') return <Loader2 size={13} color="#818CF8" className="animate-spin" />
  if (step.status === 'completed') return <CheckCircle size={13} color="#10B981" />
  if (step.status === 'error') return <AlertCircle size={13} color="#EF4444" />
  return <Clock size={13} color="rgba(255,255,255,0.2)" />
}

const VerticalNode: React.FC<Props> = ({ step, selected, onClick }) => {
  return (
    <motion.div
      layout
      onClick={onClick}
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      style={{
        position: 'relative',
        width: '100%',
        padding: '0.7rem 0.875rem',
        borderRadius: 11,
        cursor: 'pointer',
        background: selected
          ? `${statusColors[step.status]}, rgba(99,102,241,0.08)`
          : statusColors[step.status],
        border: `1.5px solid ${selected ? 'rgba(99,102,241,0.65)' : statusBorder[step.status]}`,
        transition: 'background 0.2s, border-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {step.status === 'running' && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at left center, rgba(99,102,241,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${step.color}18`,
        border: `1.5px solid ${step.color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: step.color,
      }}>
        {step.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.18rem' }}>
          <span style={{
            fontSize: '0.82rem', fontWeight: '700',
            color: step.status === 'pending' ? 'var(--text-secondary)' : step.status === 'error' ? '#FCA5A5' : 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px',
          }}>{step.label}</span>
        </div>
        <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          {step.id}
        </span>
        {step.status === 'error' && step.errorMessage && (
          <div style={{
            marginTop: '0.25rem',
            fontSize: '0.6rem', color: '#EF4444',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '160px',
          }}>
            ⚠ {step.errorMessage}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {step.duration && step.status === 'completed' && (
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {step.duration}ms
          </span>
        )}
        <StatusIcon step={step} />
      </div>
    </motion.div>
  )
}

export default VerticalNode
