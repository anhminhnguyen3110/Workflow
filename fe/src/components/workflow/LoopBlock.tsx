import React from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  target: string
  label: string
}

const LoopBlock: React.FC<Props> = ({ label }) => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.45rem 1rem', borderRadius: 20,
      background: 'rgba(245,158,11,0.08)',
      border: '1.5px dashed rgba(245,158,11,0.35)',
    }}>
      <RefreshCw size={12} color="#F59E0B" />
      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#F59E0B', fontFamily: 'JetBrains Mono' }}>
        ↩ LOOP BACK
      </span>
      <div style={{ width: 1, height: 10, background: 'rgba(245,158,11,0.3)' }} />
      <span style={{ fontSize: '0.65rem', color: 'rgba(245,158,11,0.7)' }}>to: {label}</span>
    </div>
  </div>
)

export default LoopBlock
