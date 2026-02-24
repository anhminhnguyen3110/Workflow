"""
Document Processing Pipeline — 5 nodes, conditional edge, NO LLM required.

Graph:
  START
    └─► load_document
          └─► validate_document
                ├─(invalid)─► handle_error ─► END
                └─(valid)──► extract_content
                               └─► summarize
                                     └─► finalize ─► END
"""
import time
from typing import Annotated, Optional, TypedDict

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


# ── State ────────────────────────────────────────────────────────
class DocState(TypedDict):
    messages: Annotated[list, add_messages]
    # Inputs (sent from frontend)
    file_content: Optional[str]
    file_name: Optional[str]
    task: Optional[str]
    priority: Optional[str]
    # Step outputs
    step_count: int
    is_valid: bool
    extracted: dict
    summary: dict
    final_report: dict


# ── Node 1: Load Document ────────────────────────────────────────
def load_document(state: DocState) -> DocState:
    content = state.get("file_content") or ""
    name = state.get("file_name") or "unknown.txt"
    word_count = len(content.split())
    return {
        "step_count": 1,
        "messages": [AIMessage(content=(
            f"[load_document] ✅ Loaded '{name}' — {word_count} words, "
            f"{len(content)} bytes"
        ))],
    }


# ── Node 2: Validate Document ────────────────────────────────────
def validate_document(state: DocState) -> DocState:
    content = state.get("file_content") or ""
    word_count = len(content.split())
    is_valid = word_count >= 3
    return {
        "is_valid": is_valid,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[validate_document] {'✅ PASS' if is_valid else '❌ FAIL'} — "
            f"word_count={word_count}, minimum=3"
        ))],
    }


# ── Conditional router ────────────────────────────────────────────
def route_after_validate(state: DocState) -> str:
    return "extract_content" if state.get("is_valid") else "handle_error"


# ── Node 3a: Handle Error (conditional branch) ───────────────────
def handle_error(state: DocState) -> DocState:
    return {
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            "[handle_error] ⚠️ Document too short or empty — pipeline aborted. "
            "Please upload a file with at least 3 words."
        ))],
    }


# ── Node 3b: Extract Content (happy path) ────────────────────────
def extract_content(state: DocState) -> DocState:
    content = state.get("file_content") or ""
    words = content.split()
    freq: dict[str, int] = {}
    for w in words:
        key = w.lower().strip(".,!?;:\"'")
        if len(key) > 3:
            freq[key] = freq.get(key, 0) + 1
    top_keywords = sorted(freq, key=lambda k: freq[k], reverse=True)[:10]
    extracted = {
        "word_count": len(words),
        "unique_words": len({w.lower() for w in words}),
        "keywords": top_keywords,
        "first_line": (content.split("\n")[0])[:120],
        "char_count": len(content),
    }
    return {
        "extracted": extracted,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[extract_content] 🔍 {len(words)} words, {len({w.lower() for w in words})} unique. "
            f"Top keywords: {top_keywords[:5]}"
        ))],
    }


# ── Node 4: Summarize ────────────────────────────────────────────
def summarize(state: DocState) -> DocState:
    extracted = state.get("extracted") or {}
    content = state.get("file_content") or ""
    lines = [l for l in content.split("\n") if l.strip()]
    summary = {
        "line_count": len(lines),
        "word_count": extracted.get("word_count", 0),
        "unique_ratio": round(
            extracted.get("unique_words", 0) / max(extracted.get("word_count", 1), 1), 2
        ),
        "top_keywords": extracted.get("keywords", [])[:5],
        "first_sentence": lines[0] if lines else "",
        "last_sentence": lines[-1] if lines else "",
    }
    return {
        "summary": summary,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[summarize] 📄 {summary['line_count']} lines, "
            f"lexical_diversity={summary['unique_ratio']:.0%}"
        ))],
    }


# ── Node 5: Finalize ─────────────────────────────────────────────
def finalize(state: DocState) -> DocState:
    report = {
        "report_id": f"DOC-{int(time.time())}",
        "status": "completed",
        "task": state.get("task", "analyze"),
        "priority": state.get("priority", "normal"),
        "file": state.get("file_name"),
        "summary": state.get("summary", {}),
        "keywords": (state.get("extracted") or {}).get("keywords", []),
        "steps_completed": state.get("step_count", 0) + 1,
    }
    return {
        "final_report": report,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[finalize] ✅ Report {report['report_id']} complete — "
            f"{report['steps_completed']} steps, task={report['task']}"
        ))],
    }


# ── Graph Construction ────────────────────────────────────────────
def create_graph():
    wf = StateGraph(DocState)

    wf.add_node("load_document", load_document, metadata={"description": "Loads and reads the uploaded document content from file"})
    wf.add_node("validate_document", validate_document, metadata={"description": "Validates document format, length and required fields"})
    wf.add_node("handle_error", handle_error, metadata={"description": "Handles validation errors and formats error messages"})
    wf.add_node("extract_content", extract_content, metadata={"description": "Extracts key sections and metadata from the document"})
    wf.add_node("summarize", summarize, metadata={"description": "Generates a concise summary of the document content"})
    wf.add_node("finalize", finalize, metadata={"description": "Finalizes the processing result and prepares the output"})

    wf.add_edge(START, "load_document")
    wf.add_edge("load_document", "validate_document")
    wf.add_conditional_edges(
        "validate_document",
        route_after_validate,
        {"extract_content": "extract_content", "handle_error": "handle_error"},
    )
    wf.add_edge("handle_error", END)
    wf.add_edge("extract_content", "summarize")
    wf.add_edge("summarize", "finalize")
    wf.add_edge("finalize", END)

    return wf.compile()


graph = create_graph()
