import React from 'react'
import { motion } from 'framer-motion'
import { GitBranch, ArrowRight, RefreshCw } from 'lucide-react'
import { GraphNode } from '../../types/graph'
import StepBlock from './StepBlock'

const PATH_COLORS = ['#06B6D4', '#A78BFA', '#F97316', '#22C55E', '#EC4899', '#F59E0B']

interface Props {
  branches: GraphNode[][]
  conditionLabels: string[]
  loopBacks: boolean[]
  selectedNode: GraphNode | null
  onSelect: (node: GraphNode) => void
  startIndex: number
}

const BranchBlock: React.FC<Props> = ({ branches, conditionLabels, loopBacks, selectedNode, onSelect, startIndex }) => {
  const len = branches.length
  const colW = 480
  const colGap = 10
  const totalW = len * colW + (len - 1) * colGap
  const offsetLeft = -((totalW - 480) / 2)

  return (
    <div style={{ width: totalW, marginLeft: offsetLeft }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 2, height: 16, background: 'rgba(245,158,11,0.5)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.1rem', borderRadius: 9,
          background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.32)',
          boxShadow: '0 0 0 5px rgba(245,158,11,0.04)',
        }}>
          <GitBranch size={13} color="#F59E0B" />
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F59E0B', letterSpacing: '0.08em' }}>PATHS</span>
          <div style={{ width: 1, height: 12, background: 'rgba(245,158,11,0.3)' }} />
          <span style={{ fontSize: '0.63rem', color: 'rgba(245,158,11,0.6)', fontFamily: 'JetBrains Mono' }}>
            {len} routes
          </span>
        </div>
      </div>

      <div style={{ height: 12 }} />
      <div style={{ position: 'relative', height: 40 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 2, height: 20,
          background: 'linear-gradient(to bottom, rgba(245,158,11,0.6), rgba(245,158,11,0.2))',
        }} />
        <div style={{
          position: 'absolute', top: 20,
          left: `${50 / len}%`, right: `${50 / len}%`,
          height: 2,
          background: `linear-gradient(to right, ${PATH_COLORS[0]}55, rgba(245,158,11,0.3) 50%, ${PATH_COLORS[(len - 1) % PATH_COLORS.length]}55)`,
        }} />
        {branches.map((_, bi) => {
          const pct = ((2 * bi + 1) / (2 * len)) * 100
          const color = PATH_COLORS[bi % PATH_COLORS.length]
          const goLeft = pct < 50
          return (
            <React.Fragment key={bi}>
              <div style={{
                position: 'absolute', top: 20, left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: 2, height: 20,
                background: `linear-gradient(to bottom, ${color}60, ${color}cc)`,
              }} />
              <div style={{
                position: 'absolute', top: 37, left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: 8, height: 8, borderRadius: '50%',
                background: color, boxShadow: `0 0 8px 2px ${color}70`,
              }} />
              <motion.div
                style={{
                  position: 'absolute', top: 19, left: '50%',
                  width: 18, height: 4, borderRadius: 2,
                  background: goLeft ? `linear-gradient(to left, transparent, ${color})` : `linear-gradient(to right, transparent, ${color})`,
                  boxShadow: `0 0 6px 1px ${color}60`,
                  pointerEvents: 'none',
                }}
                animate={{ x: goLeft ? [0, -(totalW / 2 - (totalW / (2 * len))) - 8] : [0, (totalW / 2 - (totalW / (2 * len))) + 8], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.7, ease: 'easeIn', repeat: Infinity, repeatDelay: 1.4, delay: bi * 0.35 }}
              />
              <motion.div
                style={{
                  position: 'absolute', left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  width: 4, height: 12, borderRadius: 2,
                  background: `linear-gradient(to bottom, transparent, ${color})`,
                  boxShadow: `0 0 6px 1px ${color}60`,
                  pointerEvents: 'none',
                }}
                animate={{ top: [20, 34], opacity: [0, 1, 0] }}
                transition={{ duration: 0.4, ease: 'easeIn', repeat: Infinity, repeatDelay: 1.4, delay: bi * 0.35 + 0.55 }}
              />
            </React.Fragment>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${len}, ${colW}px)`, gap: `${colGap}px` }}>
        {branches.map((branch, bi) => {
          const color = PATH_COLORS[bi % PATH_COLORS.length]
          const letter = String.fromCharCode(65 + bi)
          const isLoopBack = loopBacks[bi]
          return (
            <div key={bi} style={{
              borderRadius: 10, overflow: 'hidden',
              border: `1.5px solid ${isLoopBack ? 'rgba(245,158,11,0.3)' : color + '28'}`,
              background: isLoopBack ? 'rgba(245,158,11,0.04)' : `${color}05`,
            }}>
              <div style={{
                padding: '0.45rem 0.75rem',
                borderBottom: `1px solid ${isLoopBack ? 'rgba(245,158,11,0.2)' : color + '20'}`,
                background: isLoopBack ? 'rgba(245,158,11,0.08)' : `linear-gradient(90deg, ${color}18 0%, ${color}06 100%)`,
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  background: isLoopBack ? 'rgba(245,158,11,0.15)' : `${color}20`,
                  border: `1.5px solid ${isLoopBack ? 'rgba(245,158,11,0.5)' : color + '50'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isLoopBack
                    ? <RefreshCw size={10} color="#F59E0B" />
                    : <span style={{ fontSize: '0.62rem', fontWeight: '800', color, fontFamily: 'JetBrains Mono' }}>{letter}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: '700', color: isLoopBack ? '#F59E0B' : `${color}cc`, letterSpacing: '0.07em', display: 'block' }}>
                    {isLoopBack ? 'LOOP BACK' : `PATH ${letter}`}
                  </span>
                  {conditionLabels[bi] && (
                    <span style={{ fontSize: '0.6rem', color: isLoopBack ? 'rgba(245,158,11,0.7)' : `${color}88`, fontFamily: 'JetBrains Mono', display: 'block', marginTop: '0.1rem' }}>
                      if: {conditionLabels[bi]}
                    </span>
                  )}
                </div>
                {!isLoopBack && <ArrowRight size={10} color={`${color}44`} style={{ flexShrink: 0 }} />}
              </div>
              <div style={{ padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isLoopBack && branch.length === 0 ? (
                  <div style={{
                    padding: '0.75rem', textAlign: 'center', borderRadius: 8,
                    background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.25)',
                  }}>
                    <RefreshCw size={16} color="rgba(245,158,11,0.5)" style={{ margin: '0 auto 0.4rem' }} />
                    <span style={{ fontSize: '0.7rem', color: 'rgba(245,158,11,0.6)' }}>
                      Loops to: {conditionLabels[bi]}
                    </span>
                  </div>
                ) : (
                  branch.map((node) => (
                    <StepBlock
                      key={node.id}
                      node={node}
                      index={startIndex + bi}
                      selected={selectedNode?.id === node.id}
                      onSelect={() => onSelect(node)}
                    />
                  ))
                )}
                {isLoopBack && branch.length > 0 && (
                  <div style={{
                    marginTop: '0.25rem', padding: '0.4rem 0.6rem', borderRadius: 6,
                    background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <RefreshCw size={11} color="#F59E0B" />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(245,158,11,0.8)', fontFamily: 'JetBrains Mono' }}>
                      ↩ then loops to: {conditionLabels[bi]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'relative', height: 32 }}>
        <div style={{
          position: 'absolute', bottom: 0,
          left: `${50 / len}%`, right: `${50 / len}%`,
          height: 2, background: 'rgba(16,185,129,0.22)',
        }} />
        {branches.map((_, bi) => {
          const pct = ((2 * bi + 1) / (2 * len)) * 100
          return (
            <div key={bi} style={{
              position: 'absolute', bottom: 0, left: `${pct}%`,
              transform: 'translateX(-50%)',
              width: 2, height: 32, background: 'rgba(16,185,129,0.35)',
            }} />
          )
        })}
        <div style={{
          position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
          width: 8, height: 8, borderRadius: '50%',
          background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.6)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 2, height: 16, background: 'rgba(16,185,129,0.4)' }} />
      </div>
    </div>
  )
}

export default BranchBlock
