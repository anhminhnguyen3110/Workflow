"""
ETL Data Pipeline — 6 nodes, conditional quality-check branch, NO LLM required.

Graph:
  START
    └─► ingest_data
          └─► clean_data
                └─► quality_check
                      ├─(low quality)─► flag_review ─┐
                      └─(high quality)─► enrich_data ─┤
                                                       └─► aggregate_output ─► END
"""
import time
from typing import Annotated, List, Optional, TypedDict

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


# ── State ────────────────────────────────────────────────────────
class ETLState(TypedDict):
    messages: Annotated[list, add_messages]
    # Inputs
    file_content: Optional[str]
    file_name: Optional[str]
    task: Optional[str]
    priority: Optional[str]
    # Step outputs
    step_count: int
    raw_records: List[dict]
    clean_records: List[dict]
    quality_score: float
    enriched_records: List[dict]
    review_notes: List[str]
    output: dict


# ── Node 1: Ingest Data ──────────────────────────────────────────
def ingest_data(state: ETLState) -> ETLState:
    content = state.get("file_content") or ""
    lines = [l.strip() for l in content.splitlines() if l.strip()]
    raw_records = [{"id": i + 1, "raw": line} for i, line in enumerate(lines)]
    return {
        "step_count": 1,
        "raw_records": raw_records,
        "messages": [AIMessage(content=(
            f"[ingest_data] 📥 Ingested {len(raw_records)} records "
            f"from '{state.get('file_name', 'unknown.txt')}'"
        ))],
    }


# ── Node 2: Clean Data ───────────────────────────────────────────
def clean_data(state: ETLState) -> ETLState:
    raw = state.get("raw_records") or []
    clean = []
    for r in raw:
        text = r["raw"]
        cleaned = " ".join(text.split())           # normalise whitespace
        cleaned = cleaned.strip(".,;:!?\"'")        # strip trailing punctuation
        if cleaned:
            clean.append({"id": r["id"], "text": cleaned, "length": len(cleaned)})
    removed = len(raw) - len(clean)
    return {
        "clean_records": clean,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[clean_data] 🧹 {len(clean)} records kept, {removed} removed "
            f"(empty/whitespace)"
        ))],
    }


# ── Node 3: Quality Check ────────────────────────────────────────
def quality_check(state: ETLState) -> ETLState:
    records = state.get("clean_records") or []
    if not records:
        score = 0.0
    else:
        avg_len = sum(r["length"] for r in records) / len(records)
        # score 0‒1: penalise very short average length
        score = round(min(avg_len / 80, 1.0), 2)
    return {
        "quality_score": score,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[quality_check] 📊 quality_score={score:.2f} "
            f"({'HIGH ✅' if score >= 0.4 else 'LOW ⚠️'}) — "
            f"{len(records)} clean records, threshold=0.40"
        ))],
    }


# ── Conditional router ────────────────────────────────────────────
def route_after_quality(state: ETLState) -> str:
    return "enrich_data" if state.get("quality_score", 0) >= 0.4 else "flag_review"


# ── Node 4a: Flag Review (low quality branch) ────────────────────
def flag_review(state: ETLState) -> ETLState:
    records = state.get("clean_records") or []
    notes = [
        f"Record #{r['id']} is very short ({r['length']} chars)" 
        for r in records if r["length"] < 20
    ]
    return {
        "review_notes": notes or ["All records flagged for manual review"],
        "enriched_records": records,   # pass through unchanged
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[flag_review] 🚩 {len(notes)} issues flagged for review. "
            "Data forwarded for aggregation with review flag."
        ))],
    }


# ── Node 4b: Enrich Data (high quality branch) ───────────────────
def enrich_data(state: ETLState) -> ETLState:
    records = state.get("clean_records") or []
    enriched = []
    for r in records:
        words = r["text"].split()
        enriched.append({
            **r,
            "word_count": len(words),
            "has_numbers": any(w.isdigit() for w in words),
            "uppercase_ratio": round(sum(1 for c in r["text"] if c.isupper()) / max(len(r["text"]), 1), 2),
        })
    return {
        "enriched_records": enriched,
        "review_notes": [],
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[enrich_data] ✨ Enriched {len(enriched)} records with "
            "word_count, has_numbers, uppercase_ratio"
        ))],
    }


# ── Node 5: Aggregate Output ─────────────────────────────────────
def aggregate_output(state: ETLState) -> ETLState:
    enriched = state.get("enriched_records") or []
    total_words = sum(r.get("word_count", len(r["text"].split())) for r in enriched)
    output = {
        "pipeline_id": f"ETL-{int(time.time())}",
        "status": "flagged_for_review" if state.get("review_notes") else "completed",
        "task": state.get("task", "etl"),
        "priority": state.get("priority", "normal"),
        "total_records": len(enriched),
        "total_words": total_words,
        "quality_score": state.get("quality_score", 0),
        "review_notes": state.get("review_notes", []),
        "steps_completed": state.get("step_count", 0) + 1,
    }
    return {
        "output": output,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[aggregate_output] ✅ Pipeline {output['pipeline_id']} done — "
            f"{output['total_records']} records, {output['total_words']} words, "
            f"status={output['status']}"
        ))],
    }


# ── Graph Construction ────────────────────────────────────────────
def create_research_graph():
    wf = StateGraph(ETLState)

    wf.add_node("ingest_data", ingest_data)
    wf.add_node("clean_data", clean_data)
    wf.add_node("quality_check", quality_check)
    wf.add_node("flag_review", flag_review)
    wf.add_node("enrich_data", enrich_data)
    wf.add_node("aggregate_output", aggregate_output)

    wf.add_edge(START, "ingest_data")
    wf.add_edge("ingest_data", "clean_data")
    wf.add_edge("clean_data", "quality_check")
    wf.add_conditional_edges(
        "quality_check",
        route_after_quality,
        {"enrich_data": "enrich_data", "flag_review": "flag_review"},
    )
    wf.add_edge("flag_review", "aggregate_output")
    wf.add_edge("enrich_data", "aggregate_output")
    wf.add_edge("aggregate_output", END)

    return wf.compile()


research_graph = create_research_graph()
