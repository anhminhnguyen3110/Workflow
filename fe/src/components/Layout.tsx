import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Layers } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%', width: '700px', height: '700px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />

      {/* Header */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: scrolled
            ? 'rgba(8, 12, 22, 0.94)'
            : 'rgba(8, 12, 22, 0.68)',
          borderBottom: '1px solid var(--border)',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: '0 2rem', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link to="/workflows" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #60A5FA 0%, #6366F1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(96,165,250,0.30)'
            }}>
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Flow<span style={{ color: 'var(--cyan)' }}>Hub</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-2px' }}>
                AG·UI + LangGraph
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {[
              { path: '/workflows', label: 'Workflows', icon: <Layers size={15} /> },
            ].map(({ path, label, icon }) => {
              const active = location.pathname.startsWith(path)
              return (
                <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                    background: active ? 'var(--cyan-dim)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(96,165,250,0.3)' : 'transparent'}`,
                    fontSize: '0.875rem', fontWeight: '500',
                    transition: 'var(--transition)', cursor: 'pointer'
                  }}>
                    {icon} {label}
                  </div>
                </Link>
              )
            })}

            {/* Status dot */}
            <div style={{
              marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.9rem', borderRadius: '8px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: '600' }}>Live</span>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Main */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem', minHeight: 'calc(100vh - 64px)' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default Layout
