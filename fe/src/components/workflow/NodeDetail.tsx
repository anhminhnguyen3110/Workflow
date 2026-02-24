import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Hash, Info, ChevronDown, ChevronRight, GitBranch, Cpu, LayoutList,
} from 'lucide-react'
import { GraphNode, GraphEdge } from '../../types/graph'
import GraphSchemaPanel from './GraphSchemaPanel'

interface Props {
  node: GraphNode
  allNodes: GraphNode[]
  edges: GraphEdge[]
  workflowId: string
  onClose: () => void
}

type Tab = 'info' | 'schema'

const NodeDetail: React.FC<Props> = ({ node, allNodes, edges, workflowId, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const incoming = edges.filter(e => e.target === node.id).map(e => e.source)
  const outgoing = edges.filter(e => e.source === node.id)
  const isConditionalSource = outgoing.some(e => e.isConditional)

  return (
    <motion.div
      key="node-detail"
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.22 }}
      style={{
        border: `1.5px solid ${node.color}40`,
        borderRadius: 14, overflow: 'hidden',
        background: `linear-gradient(160deg, ${node.color}08 0%, rgba(8,12,22,0.8) 60%)`,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1.125rem',
        borderBottom: `1px solid ${node.color}20`,
        background: `${node.color}08`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: `${node.color}22`, border: `2px solid ${node.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cpu size={13} color={node.color} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>
            {node.label}
          </span>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {node.id}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', padding: '0.3rem',
          }}
        >
          <X size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.2rem', padding: '0.5rem 0.875rem 0', background: 'rgba(0,0,0,0.2)' }}>
        {([
          { id: 'info' as Tab, label: 'Info', icon: <Info size={11} /> },
          { id: 'schema' as Tab, label: 'Schema', icon: <LayoutList size={11} /> },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.8rem', borderRadius: '7px 7px 0 0', border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: '600',
              background: activeTab === t.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: activeTab === t.id ? node.color : 'var(--text-muted)',
              borderBottom: activeTab === t.id ? `2px solid ${node.color}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div
            key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
          >
            <div style={{
              padding: '1rem', borderRadius: 10,
              background: `${node.color}0c`, border: `1px solid ${node.color}28`,
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: `${node.color}22`, border: `2.5px solid ${node.color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: node.color, fontFamily: 'JetBrains Mono' }}>
                  {String(allNodes.findIndex(n => n.id === node.id) + 1).padStart(2, '0')}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {node.label}
                </div>
                <div style={{ fontSize: '0.67rem', color: node.color, fontFamily: 'JetBrains Mono', marginTop: '0.2rem' }}>
                  {node.id}
                </div>
              </div>
            </div>

            {[
              { icon: <Hash size={11} color="var(--text-muted)" />, label: 'Node ID', value: node.id },
              { icon: <Info size={11} color="var(--text-muted)" />, label: 'Type', value: node.type || 'runnable' },
              { icon: <ChevronDown size={11} color="var(--text-muted)" />, label: 'Incoming', value: incoming.join(', ') || '—' },
              { icon: <ChevronRight size={11} color="var(--text-muted)" />, label: 'Outgoing', value: outgoing.map(e => `${e.target}${e.isConditional ? ' (cond)' : ''}`).join(', ') || '—' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <div style={{ paddingTop: '0.15rem', flexShrink: 0 }}>{icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', wordBreak: 'break-all', lineHeight: 1.4 }}>{value}</div>
                </div>
              </div>
            ))}

            {isConditionalSource && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.75rem', borderRadius: 8,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <GitBranch size={12} color="#F59E0B" />
                <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: '600' }}>Conditional routing node</span>
              </div>
            )}
          </motion.div>
        ) : (
          <GraphSchemaPanel
            key="schema"
            workflowId={workflowId}
            accentColor={node.color}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default NodeDetail
