import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import WorkflowList from './pages/WorkflowList'
import WorkflowDetail from './pages/WorkflowDetail'
import WorkflowRun from './pages/WorkflowRun'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/workflows" replace />} />
          <Route path="/workflows" element={<WorkflowList />} />
          <Route path="/workflows/:workflowId" element={<WorkflowDetail />} />
          <Route path="/workflows/:workflowId/runs/:runId" element={<WorkflowRun />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
