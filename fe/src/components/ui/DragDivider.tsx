import React from 'react'

interface Props {
  onMouseDown: (e: React.MouseEvent) => void
}

const DragDivider: React.FC<Props> = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    style={{
      width: 6,
      cursor: 'col-resize',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      position: 'relative',
      zIndex: 10,
      userSelect: 'none',
    }}
    className="drag-divider"
  >
    <div style={{
      width: 2,
      height: '100%',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 2,
      transition: 'background 0.2s',
    }} />
    <style>{`
      .drag-divider:hover > div { background: rgba(99,102,241,0.5) !important; }
      .drag-divider:active > div { background: rgba(99,102,241,0.8) !important; }
    `}</style>
  </div>
)

export default DragDivider
