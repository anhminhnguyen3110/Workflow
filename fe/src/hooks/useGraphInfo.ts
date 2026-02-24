import { useState, useEffect } from 'react'
import { GraphNode, GraphEdge, formatNodeLabel } from '../types/graph'
import { langgraphAPI } from '../services/langgraph'

const NODE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899']

interface UseGraphInfoResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  loading: boolean
  error: string | null
}

export function useGraphInfo(workflowId: string | undefined): UseGraphInfoResult {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workflowId) return
    setLoading(true)
    setError(null)
    langgraphAPI.getGraphInfo(workflowId)
      .then((graph: any) => {
        const parsedNodes: GraphNode[] = (graph.nodes ?? [])
          .filter((n: any) => n.id !== '__start__' && n.id !== '__end__')
          .map((n: any, i: number) => ({
            id: n.id,
            label: formatNodeLabel(n.data?.name ?? n.id),
            type: n.type,
            color: NODE_COLORS[i % NODE_COLORS.length],
          }))
        const parsedEdges: GraphEdge[] = (graph.edges ?? [])
          .filter((e: any) => e.source !== '__start__' && e.target !== '__end__')
          .map((e: any) => ({
            source: e.source,
            target: e.target,
            isConditional: !!e.conditional,
            conditionLabel: typeof e.conditional === 'string'
              ? e.conditional
              : (e.data?.name ?? formatNodeLabel(e.target)),
          }))
        setNodes(parsedNodes)
        setEdges(parsedEdges)
      })
      .catch((err: any) => setError(err?.message ?? 'Failed to load graph'))
      .finally(() => setLoading(false))
  }, [workflowId])

  return { nodes, edges, loading, error }
}
