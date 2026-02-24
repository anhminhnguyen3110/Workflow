import { useState, useCallback, useRef, useEffect } from 'react'

interface UseSplitPaneResult {
  splitPct: number
  onDividerMouseDown: (e: React.MouseEvent) => void
}

export function useSplitPane(initial = 50): UseSplitPaneResult {
  const [splitPct, setSplitPct] = useState(initial)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartPct = useRef(initial)
  const containerRef = useRef<HTMLElement | null>(null)

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartPct.current = splitPct
    containerRef.current = (e.currentTarget as HTMLElement).parentElement
    document.body.style.cursor = 'col-resize'
    ;(document.body.style as any).userSelect = 'none'
  }, [splitPct])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const deltaPct = ((e.clientX - dragStartX.current) / rect.width) * 100
      setSplitPct(Math.min(75, Math.max(25, dragStartPct.current + deltaPct)))
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      ;(document.body.style as any).userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  return { splitPct, onDividerMouseDown }
}
