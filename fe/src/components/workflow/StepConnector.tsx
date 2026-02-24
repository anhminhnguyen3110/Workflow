import React from 'react'
import { motion } from 'framer-motion'

const StepConnector: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 52 }}>
    <div style={{
      width: 2, height: 44,
      background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.18))',
    }} />
    <div style={{
      width: 0, height: 0,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderTop: '7px solid rgba(255,255,255,0.22)',
    }} />
    <motion.div
      style={{
        position: 'absolute', top: 2, left: '50%', translateX: '-50%',
        width: 4, height: 16, borderRadius: 2,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85))',
        boxShadow: '0 0 8px 2px rgba(255,255,255,0.2)',
        pointerEvents: 'none',
      }}
      animate={{ y: [0, 38], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8 }}
    />
  </div>
)

export default StepConnector
