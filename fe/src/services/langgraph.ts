import { Client } from '@langchain/langgraph-sdk'

const lgClient = new Client({ apiUrl: 'http://localhost:8123' })

export { lgClient }

const RUN_INPUT_PREFIX = 'wf_run_input_'

export const langgraphAPI = {
  async getAssistants() {
    return lgClient.assistants.search({ limit: 100 })
  },

  async getAssistant(assistantId: string) {
    return lgClient.assistants.get(assistantId)
  },

  async getGraphInfo(assistantId: string) {
    return lgClient.assistants.getGraph(assistantId)
  },

  async createThread() {
    return lgClient.threads.create()
  },

  async getThread(threadId: string) {
    return lgClient.threads.get(threadId)
  },

  async getThreadState(threadId: string) {
    return lgClient.threads.getState(threadId)
  },

  async cancelRun(threadId: string, runId: string) {
    return lgClient.runs.cancel(threadId, runId)
  },

  storeRunInput(threadId: string, input: Record<string, unknown>) {
    sessionStorage.setItem(RUN_INPUT_PREFIX + threadId, JSON.stringify(input))
  },

  getRunInput(threadId: string): Record<string, unknown> | null {
    const raw = sessionStorage.getItem(RUN_INPUT_PREFIX + threadId)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  },

  clearRunInput(threadId: string) {
    sessionStorage.removeItem(RUN_INPUT_PREFIX + threadId)
  },

  async *streamRun(
    assistantId: string,
    threadId: string,
    input: Record<string, unknown>,
    interruptBefore?: string[],
  ): AsyncGenerator<{ event: string; data: any }> {
    const opts: any = {
      input,
      streamMode: ['updates', 'values', 'debug'],
    }
    if (interruptBefore && interruptBefore.length > 0) {
      opts.interruptBefore = interruptBefore
    }
    const stream = lgClient.runs.stream(threadId, assistantId, opts)
    for await (const chunk of stream) {
      yield { event: chunk.event, data: chunk.data }
    }
  },

  async *resumeRun(
    assistantId: string,
    threadId: string,
  ): AsyncGenerator<{ event: string; data: any }> {
    const stream = lgClient.runs.stream(threadId, assistantId, {
      input: null,
      streamMode: ['updates', 'values', 'debug'],
    } as any)
    for await (const chunk of stream) {
      yield { event: chunk.event, data: chunk.data }
    }
  },
}
