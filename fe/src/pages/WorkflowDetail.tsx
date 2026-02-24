import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap } from 'lucide-react'
import { langgraphAPI } from '../services/langgraph'
import { useGraphInfo } from '../hooks/useGraphInfo'
import { GraphNode } from '../types/graph'
import FlowCanvas from '../components/workflow/FlowCanvas'
import NodeDetail from '../components/workflow/NodeDetail'
import RunConfigPanel from '../components/workflow/RunConfigPanel'

const WorkflowDetail: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const [workflowName, setWorkflowName] = useState('')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const { nodes, edges, loading } = useGraphInfo(workflowId)

  useEffect(() => {
    if (!workflowId) return
    langgraphAPI.getAssistant(workflowId)
      .then((a: any) => {
        const raw = a?.name || a?.graph_id || workflowId!
        setWorkflowName(raw.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
      })
      .catch(() => setWorkflowName(workflowId!))
  }, [workflowId])

  const handleRunStart = (path: string) => {
    navigate(path)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <motion.button
        className="btn-ghost"
        onClick={() => navigate('/workflows')}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ padding: '0.4rem 0', marginBottom: '1.125rem', gap: '0.4rem', alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={14} /> Back to Workflows
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexShrink: 0 }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))',
          border: '1.5px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={19} color="#818CF8" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {workflowName || '—'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {nodes.length} steps · Pipeline
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: '600' }}>Ready</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.75rem', flex: 1, minHeight: 0 }}>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          loading={loading}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto', maxHeight: 560 }} className="custom-scrollbar">
          {workflowId && (
            <RunConfigPanel workflowId={workflowId} onRunStart={handleRunStart} />
          )}
          {selectedNode
            ? <NodeDetail node={selectedNode} allNodes={nodes} edges={edges} workflowId={workflowId!} onClose={() => setSelectedNode(null)} />
            : <div style={{
                padding: '2rem 1rem', textAlign: 'center',
                border: '1.5px dashed rgba(255,255,255,0.08)', borderRadius: 14,
                color: 'var(--text-muted)', fontSize: '0.82rem',
              }}>
                Click any node in the canvas to inspect it
              </div>
          }
        </div>
      </div>
    </div>
  )
}

export default WorkflowDetail
