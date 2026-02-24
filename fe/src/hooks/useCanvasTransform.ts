import { useState, useCallback, useRef, RefObject } from 'react'

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}

interface UseCanvasTransformResult {
  transform: CanvasTransform
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>
  handleWheel: (e: React.WheelEvent) => void
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  isDragging: boolean
  centerCanvas: () => void
  zoomIn: () => void
  zoomOut: () => void
}

export function useCanvasTransform(
  canvasRef: RefObject<HTMLDivElement>,
  contentRef: RefObject<HTMLDivElement>
): UseCanvasTransformResult {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, tx: 0, ty: 0 })

  const centerCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const cw = canvasRef.current.clientWidth
    const ch = canvasRef.current.clientHeight
    const contentW = (contentRef.current?.scrollWidth ?? 480) + 40
    const contentH = (contentRef.current?.scrollHeight ?? 600) + 48
    const scaleW = (cw - 48) / contentW
    const scaleH = (ch - 48) / contentH
    const scale = Math.min(0.92, scaleW, scaleH)
    const x = (cw - contentW * scale) / 2
    setTransform({ x, y: 24, scale })
  }, [canvasRef, contentRef])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setTransform(t => {
      const ns = Math.max(0.25, Math.min(3, t.scale * factor))
      return { x: mx - (mx - t.x) * (ns / t.scale), y: my - (my - t.y) * (ns / t.scale), scale: ns }
    })
  }, [canvasRef])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y }
  }, [transform])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setTransform(t => ({
      ...t,
      x: dragOrigin.current.tx + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.ty + (e.clientY - dragOrigin.current.my),
    }))
  }, [isDragging])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  const zoomIn = useCallback(() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.2) })), [])
  const zoomOut = useCallback(() => setTransform(t => ({ ...t, scale: Math.max(0.25, t.scale / 1.2) })), [])

  return { transform, setTransform, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, isDragging, centerCanvas, zoomIn, zoomOut }
}
