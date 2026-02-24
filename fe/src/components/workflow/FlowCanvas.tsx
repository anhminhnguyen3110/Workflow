import React, { useRef, useEffect } from 'react'
import { GraphNode, GraphEdge, buildSegments } from '../../types/graph'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import TerminalNode from '../shared/TerminalNode'
import StepConnector from './StepConnector'
import StepBlock from './StepBlock'
import BranchBlock from './BranchBlock'
import LoopBlock from './LoopBlock'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  loading: boolean
  selectedNode: GraphNode | null
  onSelectNode: (node: GraphNode | null) => void
}

const FlowCanvas: React.FC<Props> = ({ nodes, edges, loading, selectedNode, onSelectNode }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    transform, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, isDragging, centerCanvas, zoomIn, zoomOut,
  } = useCanvasTransform(canvasRef, contentRef)

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(centerCanvas, 200)
      return () => clearTimeout(t)
    }
  }, [loading, centerCanvas])

  useEffect(() => {
    window.addEventListener('resize', centerCanvas)
    return () => window.removeEventListener('resize', centerCanvas)
  }, [centerCanvas])

  const segments = buildSegments(nodes, edges)
  let nodeCount = 0

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        height: 520,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, display: 'flex', gap: '0.3rem' }}>
        {[
          { label: '+', fn: zoomIn },
          { label: '−', fn: zoomOut },
          { label: '⊡', fn: centerCanvas },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              fontSize: label === '⊡' ? '0.75rem' : '1rem', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, userSelect: 'none',
            }}
          >{label}</button>
        ))}
      </div>
      <div style={{
        position: 'absolute', bottom: 10, right: 10, zIndex: 20,
        fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono',
        background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.5rem', borderRadius: 4,
      }}>
        {Math.round(transform.scale * 100)}%
      </div>

      <div style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: '0 0',
        padding: '1.25rem',
        width: 'max-content',
        userSelect: 'none',
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 480, gap: 0 }}>
            <StepConnector />
            {Array.from({ length: 4 }).map((_, i) => (
              <React.Fragment key={i}>
                <div style={{
                  height: 64, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.07)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
                {i < 3 && <StepConnector />}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 480 }}>
            <TerminalNode type="start" />
            <StepConnector />
            {segments.map((seg, si) => {
              const isLast = si === segments.length - 1
              if (seg.type === 'loop') {
                return (
                  <React.Fragment key={`loop-${si}`}>
                    <LoopBlock target={seg.target} label={seg.label} />
                    {!isLast && <StepConnector />}
                  </React.Fragment>
                )
              }
              if (seg.type === 'node') {
                const idx = nodeCount++
                return (
                  <React.Fragment key={seg.node.id}>
                    <StepBlock
                      node={seg.node}
                      index={idx}
                      selected={selectedNode?.id === seg.node.id}
                      onSelect={() => onSelectNode(selectedNode?.id === seg.node.id ? null : seg.node)}
                    />
                    {!isLast && <StepConnector />}
                  </React.Fragment>
                )
              }
              const branchStart = nodeCount
              nodeCount += seg.branches.length
              return (
                <React.Fragment key={`branch-${si}`}>
                  <BranchBlock
                    branches={seg.branches}
                    conditionLabels={seg.conditionLabels}
                    loopBacks={seg.loopBacks}
                    selectedNode={selectedNode}
                    onSelect={node => onSelectNode(selectedNode?.id === node.id ? null : node)}
                    startIndex={branchStart}
                  />
                  {!isLast && <StepConnector />}
                </React.Fragment>
              )
            })}
            <StepConnector />
            <TerminalNode type="end" />
          </div>
        )}
      </div>
    </div>
  )
}

export default FlowCanvas
