"""
Content Review Loop — cyclic graph demonstrating LangGraph loops.

Graph:
  START
    └─► extract
          └─► review
                ├─(low score, retries left)─► refine ─┐
                ├─(low score, max retries)──► escalate ─┤
                └─(approved)───────────────► format    ─► finalize ─► END
                                              ↑
                                    refine loop-back
"""
import time
from typing import Annotated, List, Optional, TypedDict

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


class ReviewState(TypedDict):
    messages: Annotated[list, add_messages]
    file_content: Optional[str]
    file_name: Optional[str]
    task: Optional[str]
    priority: Optional[str]
    step_count: int
    raw_text: str
    review_score: float
    review_notes: List[str]
    retry_count: int
    max_retries: int
    refined_text: str
    escalated: bool
    final_output: dict
    node_failed: Optional[bool]
    node_error_message: Optional[str]


def extract(state: ReviewState) -> ReviewState:
    content = state.get("file_content") or ""
    name = state.get("file_name") or "unknown.txt"
    lines = [l.strip() for l in content.splitlines() if l.strip()]
    raw_text = " ".join(lines)
    # allow caller to override max_retries via input state (e.g. 0 → immediate escalation)
    max_r = state.get("max_retries")
    if max_r is None:
        max_r = 3
    return {
        "raw_text": raw_text,
        "retry_count": 0,
        "max_retries": int(max_r),
        "escalated": False,
        "node_failed": False,
        "node_error_message": None,
        "step_count": 1,
        "messages": [AIMessage(content=(
            f"[extract] 📥 Extracted {len(lines)} lines ({len(raw_text)} chars) from '{name}'"
        ))],
    }


def review(state: ReviewState) -> ReviewState:
    text = state.get("refined_text") or state.get("raw_text") or ""
    retry = state.get("retry_count", 0)
    word_count = len(text.split())
    char_count = len(text)
    avg_word_len = (char_count / word_count) if word_count else 0
    notes = []
    score = 0.5
    if word_count >= 20:
        score += 0.2
        notes.append(f"sufficient length ({word_count} words)")
    else:
        notes.append(f"too short ({word_count} words, need ≥20)")
    if avg_word_len >= 4.5:
        score += 0.2
        notes.append(f"good vocabulary complexity (avg {avg_word_len:.1f} chars/word)")
    else:
        notes.append(f"simple vocabulary (avg {avg_word_len:.1f} chars/word)")
    if any(c in text for c in ".!?"):
        score += 0.1
        notes.append("has punctuation")
    score = round(min(score, 1.0), 2)
    decision = "approved" if score >= 0.6 else (
        "escalated" if retry >= state.get("max_retries", 3) else "needs_refinement"
    )
    return {
        "review_score": score,
        "review_notes": notes,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[review] 🔍 score={score:.2f} retry={retry} → {decision}\n"
            f"  notes: {', '.join(notes)}"
        ))],
    }


def route_review(state: ReviewState) -> str:
    score = state.get("review_score", 0)
    retry = state.get("retry_count", 0)
    max_r = state.get("max_retries", 3)
    if score >= 0.6:
        return "format"
    if retry >= max_r:
        return "escalate"
    return "refine"


def refine(state: ReviewState) -> ReviewState:
    text = state.get("refined_text") or state.get("raw_text") or ""
    retry = state.get("retry_count", 0) + 1
    extra_sentences = [
        "This document contains important structured information.",
        "The content has been carefully reviewed and validated.",
        "Additional context has been provided for completeness.",
        "The analysis includes comprehensive data points.",
    ]
    appended = extra_sentences[retry % len(extra_sentences)]
    refined = f"{text} {appended}"
    return {
        "refined_text": refined,
        "retry_count": retry,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[refine] ✏️ Retry #{retry} — appended context, new length={len(refined.split())} words"
        ))],
    }


def escalate(state: ReviewState) -> ReviewState:
    retries = state.get("retry_count", 0)
    score = state.get("review_score", 0)
    error_msg = (
        f"Max retries ({state.get('max_retries', 3)}) exceeded — "
        f"review score {score:.2f} is below threshold after {retries} attempts"
    )
    return {
        "escalated": True,
        "node_failed": True,
        "node_error_message": error_msg,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[escalate] ⚠️ {error_msg}"
        ))],
    }


def format_output(state: ReviewState) -> ReviewState:
    text = state.get("refined_text") or state.get("raw_text") or ""
    word_count = len(text.split())
    formatted = {
        "word_count": word_count,
        "char_count": len(text),
        "sentences": len([s for s in text.split(".") if s.strip()]),
        "preview": text[:200] + ("…" if len(text) > 200 else ""),
    }
    return {
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[format] 📄 Formatted output: {word_count} words, "
            f"{formatted['sentences']} sentences"
        ))],
        "final_output": formatted,
    }


def finalize(state: ReviewState) -> ReviewState:
    escalated = state.get("escalated", False)
    retries = state.get("retry_count", 0)
    score = state.get("review_score", 0)
    result = {
        "pipeline_id": f"REVIEW-{int(time.time())}",
        "status": "escalated" if escalated else "approved",
        "review_score": score,
        "retries_used": retries,
        "escalated": escalated,
        "content": state.get("final_output") or {"escalated": True},
        "steps_completed": state.get("step_count", 0) + 1,
    }
    return {
        "final_output": result,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[finalize] ✅ Pipeline complete — status={result['status']}, "
            f"score={score:.2f}, retries={retries}"
        ))],
    }


builder = StateGraph(ReviewState)
builder.add_node("extract", extract)
builder.add_node("review", review)
builder.add_node("refine", refine)
builder.add_node("escalate", escalate)
builder.add_node("format", format_output)
builder.add_node("finalize", finalize)

builder.add_edge(START, "extract")
builder.add_edge("extract", "review")
builder.add_conditional_edges("review", route_review, {
    "refine": "refine",
    "escalate": "escalate",
    "format": "format",
})
builder.add_edge("refine", "review")
builder.add_edge("escalate", "finalize")
builder.add_edge("format", "finalize")
builder.add_edge("finalize", END)

loop_graph = builder.compile()
