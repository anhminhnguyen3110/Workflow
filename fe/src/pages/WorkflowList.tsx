import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RefreshCw, ArrowRight, GitBranch,
  AlertTriangle, CheckCircle2, Search
} from 'lucide-react'
import { langgraphAPI } from '../services/langgraph'

interface Workflow {
  assistant_id: string
  graph_id: string
  name?: string
  metadata?: any
}

const CARD_COLORS = ['var(--cyan)', 'var(--purple)', 'var(--orange)', 'var(--green)']

const WorkflowList: React.FC = () => {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await langgraphAPI.getAssistants()
      setWorkflows(data ?? [])
    } catch {
      setWorkflows([])
      setError('Backend offline — could not load workflows')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); loadWorkflows() }

  const filteredWorkflows = searchQuery.trim()
    ? workflows.filter(w =>
        (w.name || w.graph_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.graph_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workflows

  useEffect(() => { loadWorkflows() }, [])

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', marginTop: '1rem' }}
      >
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(96,165,250,0.45)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        tabIndex={-1}
        >
          <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <span style={{ fontSize: '0.75rem' }}>×</span>
            </button>
          )}
        </div>

        {/* Refresh */}
        <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing} style={{ flexShrink: 0, padding: '0.55rem 1rem' }}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}
      >
        <span style={{
          fontSize: '0.72rem',
          fontWeight: '600',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          {searchQuery
            ? `${filteredWorkflows.length} result${filteredWorkflows.length !== 1 ? 's' : ''} for "${searchQuery}"`
            : `Your workflows · ${workflows.length}`
          }
        </span>
      </motion.div>

      {/* Offline banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1.5rem', padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}
        >
          <AlertTriangle size={16} color="var(--orange)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--orange)' }}>{error}</span>
        </motion.div>
      )}

      {/* Skeleton loader */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '55%', borderRadius: 4, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
                  <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
              <div style={{ height: 11, width: '90%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
              <div style={{ height: 11, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}
        >
          {filteredWorkflows.length === 0 && searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}
            >
              <Search size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>No workflows match &ldquo;{searchQuery}&rdquo;</p>
            </motion.div>
          ) : null}
          {filteredWorkflows.map((workflow, i) => (
            <WorkflowCard
              key={workflow.assistant_id}
              workflow={workflow}
              color={CARD_COLORS[i % CARD_COLORS.length]}
              variants={cardVariants}
              onClick={() => navigate(`/workflows/${workflow.assistant_id}`)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

interface WorkflowCardProps {
  workflow: Workflow
  color: string
  variants: any
  onClick: () => void
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, color, onClick, variants }) => {
  const [hovered, setHovered] = useState(false)
  const displayName = (workflow.name || workflow.graph_id)
    .replace(/_/g, ' ').replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
  const tag = workflow.graph_id.replace(/_/g, '-')

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: `linear-gradient(145deg, ${color}07 0%, transparent 60%), var(--bg-card)`,
        border: `1px solid ${hovered ? color + '45' : 'var(--border)'}`,
        borderLeft: `3px solid ${hovered ? color : color + '60'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '1.375rem 1.5rem',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: hovered ? `0 16px 48px ${color}12` : 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header row: icon + name + tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color
        }}>
          <GitBranch size={16} />
        </div>
        <h3 style={{ flex: 1, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          {displayName}
        </h3>
        <span style={{
          padding: '0.2rem 0.55rem', borderRadius: '6px', flexShrink: 0,
          fontSize: '0.63rem', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
          background: `${color}14`, color, border: `1px solid ${color}28`
        }}>
          {tag}
        </span>
      </div>

      {/* ID */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '1rem', paddingLeft: '2.75rem', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {workflow.assistant_id}
      </p>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '0.875rem', opacity: 0.7 }} />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '2.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={11} color="var(--green)" />
          <span style={{ fontSize: '0.7rem', color: 'var(--green)' }}>Ready</span>
        </div>
        <motion.div animate={{ x: hovered ? 4 : 0 }} style={{ color, opacity: hovered ? 1 : 0.5 }}>
          <ArrowRight size={16} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default WorkflowList