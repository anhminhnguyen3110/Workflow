import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { GraphNode } from '../../types/graph'

interface Props {
  node: GraphNode
  index: number
  selected: boolean
  onSelect: () => void
}

const StepBlock: React.FC<Props> = ({ node, index, selected, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
    onClick={onSelect}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.875rem 1rem',
      background: selected
        ? `linear-gradient(135deg, ${node.color}18 0%, ${node.color}08 100%)`
        : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${selected ? node.color + '60' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: selected ? `0 0 0 3px ${node.color}14, 0 4px 14px ${node.color}18` : 'none',
    }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: selected ? `${node.color}28` : `${node.color}18`,
      border: `2px solid ${selected ? node.color + '80' : node.color + '45'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: '0.68rem', fontWeight: '800', color: node.color, fontFamily: 'JetBrains Mono' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{
        fontSize: '0.9rem', fontWeight: '600', display: 'block',
        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {node.label}
      </span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
        {node.id}
      </span>
    </div>
    {selected
      ? <CheckCircle size={14} color={node.color} style={{ flexShrink: 0 }} />
      : <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
    }
  </motion.div>
)

export default StepBlock
