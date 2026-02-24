import React from 'react'

interface Props {
  type: 'start' | 'end'
}

const TerminalNode: React.FC<Props> = ({ type }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.4rem 1.25rem', borderRadius: 24,
      background: type === 'start' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
      border: `1.5px solid ${type === 'start' ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.3)'}`,
      boxShadow: type === 'start' ? '0 0 12px rgba(16,185,129,0.15)' : '0 0 12px rgba(100,116,139,0.1)',
    }}>
      <div style={{
        width: type === 'start' ? 0 : 8,
        height: type === 'start' ? 0 : 8,
        borderRadius: type === 'start' ? 0 : 2,
        ...(type === 'start'
          ? { borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid #10B981' }
          : { background: '#64748B' }
        ),
      }} />
      <span style={{
        fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em',
        color: type === 'start' ? '#10B981' : '#64748B',
        fontFamily: 'JetBrains Mono',
      }}>
        {type === 'start' ? 'START' : 'END'}
      </span>
    </div>
  </div>
)

export default TerminalNode
