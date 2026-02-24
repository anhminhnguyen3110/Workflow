import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { langgraphAPI } from '../../services/langgraph'

interface SchemaField {
  key: string
  title: string
  type: string
  required: boolean
}

type SchemaView = 'input' | 'output'

function extractFields(schema: any): SchemaField[] {
  if (!schema?.properties) return []
  const required = new Set<string>(schema.required ?? [])
  return Object.entries(schema.properties).map(([key, def]: [string, any]) => {
    let type = 'any'
    if (def.type) {
      type = def.type
    } else if (def.anyOf) {
      const types = def.anyOf
        .map((t: any) => t.type)
        .filter((t: string) => t && t !== 'null')
      type = types.length === 1 ? types[0] : types.join(' | ')
      const hasNull = def.anyOf.some((t: any) => t.type === 'null')
      if (hasNull) type += '?'
    }
    return { key, title: def.title ?? key, type, required: required.has(key) }
  })
}

const TYPE_COLORS: Record<string, string> = {
  string: '#34D399',
  'string?': '#34D39988',
  integer: '#818CF8',
  number: '#818CF8',
  array: '#F59E0B',
  object: '#60A5FA',
  boolean: '#F87171',
}

function typeColor(type: string) {
  for (const [k, c] of Object.entries(TYPE_COLORS)) {
    if (type.startsWith(k)) return c
  }
  return 'var(--text-muted)'
}

interface Props {
  workflowId: string
  accentColor: string
}

const GraphSchemaPanel: React.FC<Props> = ({ workflowId, accentColor }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputFields, setInputFields] = useState<SchemaField[]>([])
  const [outputFields, setOutputFields] = useState<SchemaField[]>([])
  const [stateTitle, setStateTitle] = useState('')
  const [view, setView] = useState<SchemaView>('input')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    langgraphAPI.getSchemas(workflowId).then(schemas => {
      if (cancelled) return
      setInputFields(extractFields(schemas.input_schema))
      setOutputFields(extractFields(schemas.output_schema))
      setStateTitle(schemas.input_schema?.title ?? schemas.output_schema?.title ?? 'State')
      setLoading(false)
    }).catch(e => {
      if (!cancelled) { setError(e.message); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [workflowId])

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
      <Loader2 size={14} className="animate-spin" />
      Loading schema…
    </div>
  )

  if (error) return (
    <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#EF4444', fontSize: '0.75rem' }}>
      <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
      {error}
    </div>
  )

  const fields = view === 'input' ? inputFields : outputFields

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {stateTitle}
        </span>
        <span style={{
          fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: 10,
          background: `${accentColor}15`, border: `1px solid ${accentColor}35`,
          color: accentColor, fontFamily: 'JetBrains Mono',
        }}>
          {fields.length} fields
        </span>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 9, padding: '0.2rem', gap: '0.2rem' }}>
        {([
          { id: 'input' as SchemaView, label: 'Input', Icon: ArrowDownToLine },
          { id: 'output' as SchemaView, label: 'Output', Icon: ArrowUpFromLine },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              padding: '0.35rem 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: '700', transition: 'all 0.15s',
              background: view === id ? `${accentColor}20` : 'transparent',
              color: view === id ? accentColor : 'var(--text-muted)',
              boxShadow: view === id ? `inset 0 0 0 1px ${accentColor}40` : 'none',
            }}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Field list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
        >
          {fields.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 0.65rem', borderRadius: 8,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Required dot */}
              <div style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: f.required ? accentColor : 'rgba(255,255,255,0.15)',
                boxShadow: f.required ? `0 0 5px ${accentColor}80` : 'none',
              }} />

              {/* Field key */}
              <span style={{
                flex: 1, fontSize: '0.72rem', color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono', wordBreak: 'break-all',
              }}>
                {f.key}
              </span>

              {/* Type badge */}
              <span style={{
                fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 6,
                background: typeColor(f.type) + '18',
                color: typeColor(f.type),
                fontFamily: 'JetBrains Mono', fontWeight: '600', flexShrink: 0,
              }}>
                {f.type}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor }} />
          required
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          optional
        </div>
      </div>
    </motion.div>
  )
}

export default GraphSchemaPanel
