import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Loader2, CheckCircle2, AlertCircle, X, Upload, FileText } from 'lucide-react'
import { GraphNode } from '../../types/graph'
import { langgraphAPI } from '../../services/langgraph'

interface Props {
  node: GraphNode
  workflowId: string
}

type RunStatus = 'idle' | 'running' | 'done' | 'error'

const TestNodePanel: React.FC<Props> = ({ node, workflowId }) => {
  const [jsonInput, setJsonInput] = useState('{\n  "task": "test",\n  "priority": "normal"\n}')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [txtFile, setTxtFile] = useState<File | null>(null)
  const [status, setStatus] = useState<RunStatus>('idle')
  const [nodeOutput, setNodeOutput] = useState<unknown>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeNodes, setActiveNodes] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  const validateJson = (v: string): boolean => {
    try { JSON.parse(v); setJsonError(null); return true }
    catch (e: any) { setJsonError(e.message); return false }
  }

  const handleRun = async () => {
    if (!validateJson(jsonInput)) return
    if (!txtFile) { setJsonError('Upload a .txt file to test'); return }
    setStatus('running')
    setNodeOutput(null)
    setErrorMsg(null)
    setActiveNodes([])
    cancelledRef.current = false

    try {
      const fileContent = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = e => res(e.target?.result as string)
        r.onerror = rej
        r.readAsText(txtFile)
      })
      const input = { ...JSON.parse(jsonInput), file_content: fileContent, file_name: txtFile.name }
      const thread = await langgraphAPI.createThread()
      let found = false
      for await (const { event, data } of langgraphAPI.streamRun(workflowId, thread.thread_id, input)) {
        if (cancelledRef.current) break
        if (event === 'updates' && data && typeof data === 'object') {
          const nodeNames = Object.keys(data).filter(k => k !== '__metadata__')
          setActiveNodes(prev => [...new Set([...prev, ...nodeNames])])
          if (nodeNames.includes(node.id)) {
            setNodeOutput((data as any)[node.id])
            found = true
          }
        }
        if (event === 'error') {
          setErrorMsg((data as any)?.message ?? 'Stream error')
          setStatus('error')
          return
        }
      }
      if (!found) setNodeOutput({ message: 'Node was not reached in this run (may have been skipped by routing)' })
      setStatus('done')
    } catch (e: any) {
      if (!cancelledRef.current) {
        setErrorMsg(e?.message ?? 'Failed to run test')
        setStatus('error')
      }
    }
  }

  const handleCancel = () => {
    cancelledRef.current = true
    setStatus('idle')
    setActiveNodes([])
  }

  const readFile = (file: File) => {
    if (!file.name.endsWith('.txt')) return
    setTxtFile(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
    >
      <div style={{
        padding: '0.6rem 0.875rem', borderRadius: 8,
        background: `${node.color}0a`, border: `1px solid ${node.color}22`,
        fontSize: '0.72rem', color: `${node.color}cc`,
      }}>
        Runs the full workflow and captures output from <strong>{node.label}</strong>
      </div>

      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          Parameters (JSON)
        </label>
        <textarea
          value={jsonInput}
          onChange={e => { setJsonInput(e.target.value); validateJson(e.target.value) }}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 80, padding: '0.6rem',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${jsonError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8, color: 'var(--cyan)', fontFamily: 'JetBrains Mono',
            fontSize: '0.72rem', lineHeight: '1.6', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {jsonError && <p style={{ fontSize: '0.65rem', color: '#EF4444', marginTop: '0.2rem', fontFamily: 'JetBrains Mono' }}>{jsonError}</p>}
      </div>

      <div>
        <label style={{ display: 'block', cursor: 'pointer' }}>
          <input ref={fileInputRef} type="file" accept=".txt"
            onChange={e => e.target.files?.[0] && readFile(e.target.files[0])}
            style={{ display: 'none' }} />
          {!txtFile ? (
            <div style={{
              border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <Upload size={13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to upload .txt test file</span>
            </div>
          ) : (
            <div style={{
              borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.06)', padding: '0.5rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <FileText size={12} color="#10B981" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>{txtFile.name}</span>
              <button onClick={e => { e.preventDefault(); setTxtFile(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                <X size={11} />
              </button>
            </div>
          )}
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <motion.button
          onClick={status === 'running' ? handleCancel : handleRun}
          disabled={!!jsonError}
          whileHover={!!jsonError ? {} : { scale: 1.02 }}
          whileTap={!!jsonError ? {} : { scale: 0.98 }}
          style={{
            flex: 1, padding: '0.65rem', borderRadius: 9, cursor: !!jsonError ? 'not-allowed' : 'pointer',
            background: status === 'running'
              ? 'rgba(239,68,68,0.12)'
              : !!jsonError ? 'rgba(255,255,255,0.04)' : `${node.color}22`,
            color: status === 'running' ? '#EF4444' : !!jsonError ? 'var(--text-muted)' : node.color,
            fontSize: '0.78rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            border: `1px solid ${status === 'running' ? 'rgba(239,68,68,0.3)' : node.color + '35'}`,
          }}
        >
          {status === 'running'
            ? <><X size={12} /> Cancel</>
            : <><Play size={12} /> Run Test</>
          }
        </motion.button>
      </div>

      {status === 'running' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Loader2 size={12} className="animate-spin" color={node.color} />
            Running workflow…
          </div>
          {activeNodes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {activeNodes.map(n => (
                <span key={n} style={{
                  fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: 12,
                  background: n === node.id ? `${node.color}20` : 'rgba(255,255,255,0.05)',
                  color: n === node.id ? node.color : 'var(--text-muted)',
                  border: `1px solid ${n === node.id ? node.color + '40' : 'transparent'}`,
                  fontFamily: 'JetBrains Mono',
                }}>✓ {n}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {status === 'done' && nodeOutput !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#10B981', fontWeight: '600' }}>
              <CheckCircle2 size={13} /> Output from {node.label}
            </div>
            <div className="code-block" style={{ maxHeight: 200, overflow: 'auto', fontSize: '0.7rem' }}>
              {JSON.stringify(nodeOutput, null, 2)}
            </div>
          </motion.div>
        )}
        {status === 'error' && errorMsg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: '0.75rem', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={13} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TestNodePanel
