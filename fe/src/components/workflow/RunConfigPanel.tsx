import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Loader2, FileJson, AlertTriangle, CheckCircle,
  Upload, FileText, X, Settings, Zap, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { langgraphAPI } from '../../services/langgraph'

// Fields always excluded (handled by file upload or purely internal)
const SKIP_FIELDS = new Set(['messages', 'file_content', 'file_name'])

function buildDefaultJson(schema: any): string {
  if (!schema?.properties) return '{}'
  const obj: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(schema.properties) as [string, any][]) {
    if (SKIP_FIELDS.has(key)) continue
    // Determine the effective type
    let type = def.type as string | undefined
    if (!type && def.anyOf) {
      const nonNull = def.anyOf.find((t: any) => t.type && t.type !== 'null')
      type = nonNull?.type
    }
    // Skip complex types
    if (!type || type === 'array' || type === 'object') continue
    // Skip runtime-only fields (integer/number unless they look like user inputs)
    // We keep string fields and boolean; skip number/integer (they're usually runtime state)
    if (type === 'integer' || type === 'number') continue
    if (type === 'string') obj[key] = ''
    if (type === 'boolean') obj[key] = false
  }
  return JSON.stringify(obj, null, 2)
}

interface Props {
  workflowId: string
  onRunStart: (path: string) => void
}

const RunConfigPanel: React.FC<Props> = ({ workflowId, onRunStart }) => {
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [txtFile, setTxtFile] = useState<File | null>(null)
  const [txtPreview, setTxtPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hitlMode, setHitlMode] = useState(false)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaTitle, setSchemaTitle] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSchema = useCallback(async () => {
    if (!workflowId) return
    setSchemaLoading(true)
    try {
      const schemas = await langgraphAPI.getSchemas(workflowId)
      const generated = buildDefaultJson(schemas.input_schema)
      setJsonInput(generated)
      setJsonError(null)
      setSchemaTitle(schemas.input_schema?.title ?? null)
    } catch {
      // Fallback: keep current value
    } finally {
      setSchemaLoading(false)
    }
  }, [workflowId])

  useEffect(() => { loadSchema() }, [loadSchema])

  const validateJson = (v: string): boolean => {
    try { JSON.parse(v); setJsonError(null); return true }
    catch (e: any) { setJsonError(e.message); return false }
  }

  const handleJsonChange = (v: string) => {
    setJsonInput(v)
    if (v.trim()) validateJson(v)
    else setJsonError(null)
  }

  const readFile = (file: File) => {
    if (!file.name.endsWith('.txt')) { setError('Only .txt files are supported'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      setTxtPreview(content?.slice(0, 300) + (content?.length > 300 ? '...' : ''))
      setTxtFile(file)
      setError(null)
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [])

  const handleRun = async () => {
    if (!workflowId) return
    if (!validateJson(jsonInput)) return
    if (!txtFile) { setError('Please upload a .txt file'); return }
    try {
      setRunning(true)
      setError(null)
      const input = JSON.parse(jsonInput)
      const fileContent = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = e => res(e.target?.result as string)
        r.onerror = rej
        r.readAsText(txtFile)
      })
      const fullInput = { ...input, file_content: fileContent, file_name: txtFile.name, ...(hitlMode ? { __hitl__: true } : {}) }
      try {
        const thread = await langgraphAPI.createThread()
        langgraphAPI.storeRunInput(thread.thread_id, fullInput)
        onRunStart(`/workflows/${workflowId}/runs/run-${Date.now()}?threadId=${thread.thread_id}`)
      } catch {
        onRunStart(`/workflows/${workflowId}/runs/demo-run-${Date.now()}`)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to start workflow')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ border: '1.5px solid rgba(99,102,241,0.3)', borderRadius: 14, overflow: 'hidden', background: 'rgba(99,102,241,0.05)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1.125rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(99,102,241,0.2)', border: '2px solid rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Settings size={13} color="#818CF8" />
        </div>
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>Run Configuration</span>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Set inputs and trigger the workflow</span>
        </div>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileJson size={12} color="var(--cyan)" /> Parameters
              {schemaTitle && (
                <span style={{
                  fontSize: '0.58rem', padding: '0.1rem 0.4rem', borderRadius: 8,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#818CF8', fontFamily: 'JetBrains Mono', fontWeight: '600',
                }}>{schemaTitle}</span>
              )}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AnimatePresence>
              {!jsonError && jsonInput.trim() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={10} color="#10B981" />
                  <span style={{ fontSize: '0.62rem', color: '#10B981', fontWeight: '600' }}>Valid</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={loadSchema}
              disabled={schemaLoading}
              title="Regenerate from schema"
              style={{
                background: 'none', border: 'none', cursor: schemaLoading ? 'default' : 'pointer',
                color: 'var(--text-muted)', display: 'flex', padding: '0.1rem', opacity: schemaLoading ? 0.4 : 0.7,
              }}
            >
              <RefreshCw size={10} className={schemaLoading ? 'animate-spin' : ''} />
            </button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              value={schemaLoading ? '' : jsonInput}
              onChange={e => handleJsonChange(e.target.value)}
              disabled={schemaLoading}
              spellCheck={false}
              style={{
                width: '100%', minHeight: '120px', padding: '0.7rem',
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${jsonError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, color: jsonError ? '#EF4444' : 'var(--cyan)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', lineHeight: '1.7',
                resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                opacity: schemaLoading ? 0.4 : 1,
              }}
              onFocus={e => e.target.style.borderColor = jsonError ? 'rgba(239,68,68,0.6)' : 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = jsonError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}
            />
            {schemaLoading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', pointerEvents: 'none',
              }}>
                <Loader2 size={12} className="animate-spin" />
                Loading schema…
              </div>
            )}
          </div>
          <AnimatePresence>
            {jsonError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.6rem', borderRadius: 6,
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <AlertTriangle size={10} color="#EF4444" />
                <span style={{ fontSize: '0.65rem', color: '#EF4444', fontFamily: 'JetBrains Mono' }}>{jsonError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Run Mode selector */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            Run Mode
          </label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { id: false, label: 'Auto', Icon: Zap, desc: 'No approvals needed' },
              { id: true, label: 'Human Review', Icon: ShieldCheck, desc: 'Pause for approval' },
            ].map(({ id, label, Icon, desc }) => (
              <button
                key={String(id)}
                onClick={() => setHitlMode(id)}
                style={{
                  flex: 1, padding: '0.5rem 0.6rem', borderRadius: 9,
                  fontSize: '0.7rem', fontWeight: '700',
                  background: hitlMode === id
                    ? id ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.18)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    hitlMode === id
                      ? id ? 'rgba(245,158,11,0.5)' : 'rgba(99,102,241,0.5)'
                      : 'rgba(255,255,255,0.08)'
                  }`,
                  color: hitlMode === id
                    ? id ? '#F59E0B' : '#818CF8'
                    : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Icon size={11} />
                  {label}
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: '400', opacity: 0.7 }}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
            <Upload size={12} color="var(--purple)" /> Document
          </label>
          <AnimatePresence mode="wait">
            {!txtFile ? (
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input ref={fileInputRef} type="file" accept=".txt"
                  onChange={e => e.target.files?.[0] && readFile(e.target.files[0])}
                  style={{ display: 'none' }} />
                <motion.div
                  key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  style={{
                    border: `1.5px dashed ${dragging ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 8, padding: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: dragging ? 'rgba(139,92,246,0.08)' : 'rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                    background: dragging ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dragging ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload size={13} color={dragging ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: '600', color: dragging ? '#8B5CF6' : 'var(--text-secondary)', margin: 0 }}>
                      {dragging ? 'Release to upload' : 'Drop .txt or click to browse'}
                    </p>
                    <p style={{ fontSize: '0.63rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>Plain text files only</p>
                  </div>
                </motion.div>
              </label>
            ) : (
              <motion.div
                key="file" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)', overflow: 'hidden' }}
              >
                <div style={{ padding: '0.55rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: txtPreview ? '1px solid rgba(16,185,129,0.12)' : 'none' }}>
                  <FileText size={12} color="#10B981" />
                  <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{txtFile.name}</span>
                  <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>{(txtFile.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => { setTxtFile(null); setTxtPreview(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                    <X size={12} />
                  </button>
                </div>
                {txtPreview && (
                  <pre style={{
                    padding: '0.5rem 0.8rem', margin: 0,
                    fontSize: '0.65rem', color: 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono', whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word', lineHeight: 1.6, maxHeight: 64, overflow: 'hidden',
                  }}>{txtPreview}</pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle size={10} color="#EF4444" />
                <span style={{ fontSize: '0.65rem', color: '#EF4444' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          className="btn-primary"
          onClick={handleRun}
          disabled={running || !!jsonError}
          whileHover={running || !!jsonError ? {} : { scale: 1.015 }}
          whileTap={running || !!jsonError ? {} : { scale: 0.985 }}
          style={{
            width: '100%', marginTop: '0.125rem', padding: '0.85rem',
            fontSize: '0.875rem', fontWeight: '700', letterSpacing: '-0.01em', borderRadius: 10,
            background: running || !!jsonError ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: running || !!jsonError ? 'var(--text-muted)' : '#fff',
            gap: '0.6rem', justifyContent: 'center', border: 'none',
            cursor: running || !!jsonError ? 'not-allowed' : 'pointer',
            boxShadow: running || !!jsonError ? 'none' : '0 4px 20px rgba(79,70,229,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {running
            ? <><Loader2 size={14} className="animate-spin" /> Starting Pipeline...</>
            : <><Play size={13} strokeWidth={2.5} fill="currentColor" /> Run Workflow</>
          }
        </motion.button>
        <p style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Parameters and document file are both required
        </p>
      </div>
    </div>
  )
}

export default RunConfigPanel
