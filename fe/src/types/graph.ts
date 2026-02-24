export interface GraphNode {
  id: string
  label: string
  type?: string
  color: string
}

export interface GraphEdge {
  source: string
  target: string
  isConditional: boolean
  conditionLabel?: string
}

export type FlowSegment =
  | { type: 'node'; node: GraphNode }
  | { type: 'branch'; branches: GraphNode[][]; conditionLabels: string[]; loopBacks: boolean[] }
  | { type: 'loop'; target: string; label: string }

export function formatNodeLabel(id: string): string {
  return id.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function detectBackEdges(nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
  const out = new Map<string, string[]>()
  edges.forEach(e => {
    if (!out.has(e.source)) out.set(e.source, [])
    out.get(e.source)!.push(e.target)
  })
  const validIds = new Set(nodes.map(n => n.id))
  const color = new Map<string, number>()
  const backKeys = new Set<string>()
  function dfs(id: string) {
    color.set(id, 1)
    for (const nxt of (out.get(id) || [])) {
      if (!validIds.has(nxt)) continue
      if (color.get(nxt) === 1) backKeys.add(id + '->' + nxt)
      else if (!color.has(nxt)) dfs(nxt)
    }
    color.set(id, 2)
  }
  for (const n of nodes) { if (!color.has(n.id)) dfs(n.id) }
  return backKeys
}

function findMergeNode(
  branchIds: string[],
  outMap: Map<string, GraphEdge[]>,
  nodeMap: Map<string, GraphNode>,
  backEdgeKeys: Set<string>
): string | undefined {
  const reachable = (start: string): Set<string> => {
    const seen = new Set<string>()
    const q = [start]
    while (q.length) {
      const cur = q.shift()!
      for (const e of (outMap.get(cur) || [])) {
        if (!nodeMap.has(e.target) || backEdgeKeys.has(cur + '->' + e.target) || seen.has(e.target)) continue
        seen.add(e.target); q.push(e.target)
      }
    }
    return seen
  }
  const sets = branchIds.map(id => reachable(id))
  if (!sets.length) return undefined
  const intersection = [...sets[0]].filter(id => sets.every(s => s.has(id)))
  for (const id of [...sets[0]]) { if (intersection.includes(id)) return id }
  return undefined
}

export function buildSegments(nodes: GraphNode[], edges: GraphEdge[]): FlowSegment[] {
  if (!nodes.length) return []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const outMap = new Map<string, GraphEdge[]>()
  edges.forEach(e => {
    if (!outMap.has(e.source)) outMap.set(e.source, [])
    outMap.get(e.source)!.push(e)
  })
  const backEdgeKeys = detectBackEdges(nodes, edges)
  const inTargets = new Set(
    edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target) && !backEdgeKeys.has(e.source + '->' + e.target))
      .map(e => e.target)
  )
  let cur: string | undefined = nodes.find(n => !inTargets.has(n.id))?.id
  const visited = new Set<string>()
  const segs: FlowSegment[] = []

  while (cur && nodeMap.has(cur) && !visited.has(cur)) {
    const node = nodeMap.get(cur)!
    visited.add(cur)
    const allOuts = (outMap.get(cur) || [])
    const condOuts = allOuts.filter(e => e.isConditional && nodeMap.has(e.target))
    const backOuts = allOuts.filter(e => backEdgeKeys.has(e.source + '->' + e.target) && nodeMap.has(e.target))

    if (condOuts.length > 1) {
      segs.push({ type: 'node', node })
      const forwardCond = condOuts.filter(e => !backEdgeKeys.has(e.source + '->' + e.target))
      const backCond = condOuts.filter(e => backEdgeKeys.has(e.source + '->' + e.target))
      const mergeId = findMergeNode(forwardCond.map(e => e.target), outMap, nodeMap, backEdgeKeys)
      const branches: GraphNode[][] = []
      const conditionLabels: string[] = []
      const loopBacks: boolean[] = []
      for (const e of forwardCond) {
        const bn = nodeMap.get(e.target)
        if (!bn || visited.has(e.target)) continue
        visited.add(e.target)
        const pathNodes: GraphNode[] = [bn]
        let ptr: string | undefined = e.target
        while (ptr) {
          const nexts: GraphEdge[] = (outMap.get(ptr) || []).filter((ex: GraphEdge) =>
            nodeMap.has(ex.target) && !visited.has(ex.target) &&
            !backEdgeKeys.has(ex.source + '->' + ex.target) && ex.target !== mergeId
          )
          if (!nexts.length) break
          visited.add(nexts[0].target)
          pathNodes.push(nodeMap.get(nexts[0].target)!)
          ptr = nexts[0].target
        }
        const hasLoop = pathNodes.some(pn =>
          (outMap.get(pn.id) || []).some(ex => backEdgeKeys.has(ex.source + '->' + ex.target))
        )
        branches.push(pathNodes)
        conditionLabels.push(e.conditionLabel ?? formatNodeLabel(e.target))
        loopBacks.push(hasLoop)
      }
      backCond.forEach(e => {
        branches.push([])
        conditionLabels.push(e.conditionLabel ?? formatNodeLabel(e.target))
        loopBacks.push(true)
      })
      if (branches.length) segs.push({ type: 'branch', branches, conditionLabels, loopBacks })
      backOuts.forEach(e => segs.push({ type: 'loop', target: e.target, label: formatNodeLabel(e.target) }))
      cur = mergeId
    } else {
      segs.push({ type: 'node', node })
      backOuts.forEach(e => segs.push({ type: 'loop', target: e.target, label: formatNodeLabel(e.target) }))
      const next = allOuts.find(e =>
        !e.isConditional && nodeMap.has(e.target) &&
        !backEdgeKeys.has(e.source + '->' + e.target) && !visited.has(e.target)
      )
      cur = next?.target
    }
  }
  return segs
}
