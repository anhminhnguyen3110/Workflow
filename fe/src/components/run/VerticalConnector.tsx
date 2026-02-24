import React from 'react'
import { motion } from 'framer-motion'
import { StepStatus } from '../../types/run'

interface Props {
  fromStatus: StepStatus
  toStatus: StepStatus
}

const VerticalConnector: React.FC<Props> = ({ fromStatus, toStatus }) => {
  const active = fromStatus === 'completed' || fromStatus === 'running'
  const color = active ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2px 0', height: 36,
    }}>
      <div style={{ width: 2, flex: 1, background: color, borderRadius: 2, position: 'relative', overflow: 'visible' }}>
        {active && (
          <motion.div
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: fromStatus === 'running' ? '#818CF8' : '#10B981',
              boxShadow: `0 0 8px ${fromStatus === 'running' ? '#818CF8' : '#10B981'}`,
            }}
          />
        )}
      </div>
    </div>
  )
}

export default VerticalConnector
