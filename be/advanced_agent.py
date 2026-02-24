"""
Order Review Pipeline — 5 nodes, conditional risk-routing branch, NO LLM required.

Graph:
  START
    └─► parse_order
          └─► risk_assessment
                ├─(high risk)─► manual_review ─┐
                └─(low risk)──► auto_approve   ─┤
                                                └─► generate_invoice ─► END
"""
import time
from typing import Annotated, Optional, TypedDict

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


# ── State ────────────────────────────────────────────────────────
class OrderState(TypedDict):
    messages: Annotated[list, add_messages]
    # Inputs
    file_content: Optional[str]
    file_name: Optional[str]
    task: Optional[str]
    priority: Optional[str]
    # Step outputs
    step_count: int
    order: dict
    risk_score: float
    risk_flags: list
    approval: dict
    invoice: dict


# ── Node 1: Parse Order ───────────────────────────────────────────
def parse_order(state: OrderState) -> OrderState:
    content = state.get("file_content") or ""
    lines = [l.strip() for l in content.splitlines() if l.strip()]
    # Treat each line as an order item: "item_name qty price"
    items = []
    for i, line in enumerate(lines):
        parts = line.split()
        name = parts[0] if parts else f"item_{i+1}"
        try:
            qty = int(parts[1]) if len(parts) > 1 else 1
        except ValueError:
            qty = 1
        try:
            price = float(parts[2]) if len(parts) > 2 else 10.0
        except ValueError:
            price = 10.0
        items.append({"item": name, "qty": qty, "unit_price": price, "subtotal": round(qty * price, 2)})

    total = round(sum(it["subtotal"] for it in items), 2)
    order = {
        "order_id": f"ORD-{int(time.time())}",
        "file": state.get("file_name", "unknown.txt"),
        "task": state.get("task", "review"),
        "priority": state.get("priority", "normal"),
        "items": items,
        "item_count": len(items),
        "total_value": total,
    }
    return {
        "order": order,
        "step_count": 1,
        "messages": [AIMessage(content=(
            f"[parse_order] 📦 Parsed {len(items)} items, "
            f"total_value=${total:.2f} from '{order['file']}'"
        ))],
    }


# ── Node 2: Risk Assessment ───────────────────────────────────────
def risk_assessment(state: OrderState) -> OrderState:
    order = state.get("order") or {}
    flags = []
    score = 0.0

    total = order.get("total_value", 0)
    priority = (order.get("priority") or "normal").lower()
    item_count = order.get("item_count", 0)

    if total > 500:
        flags.append(f"High value order (${total:.2f} > $500)")
        score += 0.4
    if priority == "high":
        flags.append("High priority flag set")
        score += 0.3
    if item_count > 10:
        flags.append(f"Large order ({item_count} items > 10)")
        score += 0.2
    if any(it["qty"] > 50 for it in order.get("items", [])):
        flags.append("Bulk quantity detected (qty > 50)")
        score += 0.2

    score = round(min(score, 1.0), 2)
    return {
        "risk_score": score,
        "risk_flags": flags,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[risk_assessment] 🔍 risk_score={score:.2f} "
            f"({'HIGH ⚠️' if score >= 0.5 else 'LOW ✅'}) — "
            f"{len(flags)} flag(s): {flags or ['none']}"
        ))],
    }


# ── Conditional router ────────────────────────────────────────────
def route_after_risk(state: OrderState) -> str:
    return "manual_review" if state.get("risk_score", 0) >= 0.5 else "auto_approve"


# ── Node 3a: Manual Review (high risk) ───────────────────────────
def manual_review(state: OrderState) -> OrderState:
    order = state.get("order") or {}
    flags = state.get("risk_flags") or []
    approval = {
        "status": "pending_manual_review",
        "reviewed_by": "compliance_team",
        "reason": f"{len(flags)} risk flag(s) require human sign-off",
        "flags": flags,
        "auto_approved": False,
    }
    return {
        "approval": approval,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[manual_review] 🚦 Order {order.get('order_id')} sent to "
            f"compliance_team. Reason: {approval['reason']}"
        ))],
    }


# ── Node 3b: Auto Approve (low risk) ─────────────────────────────
def auto_approve(state: OrderState) -> OrderState:
    order = state.get("order") or {}
    approval = {
        "status": "auto_approved",
        "reviewed_by": "system",
        "reason": f"risk_score={state.get('risk_score', 0):.2f} below threshold",
        "flags": [],
        "auto_approved": True,
    }
    return {
        "approval": approval,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[auto_approve] ✅ Order {order.get('order_id')} "
            f"auto-approved — {approval['reason']}"
        ))],
    }


# ── Node 4: Generate Invoice ──────────────────────────────────────
def generate_invoice(state: OrderState) -> OrderState:
    order = state.get("order") or {}
    approval = state.get("approval") or {}
    invoice = {
        "invoice_id": f"INV-{int(time.time())}",
        "order_id": order.get("order_id"),
        "status": approval.get("status", "unknown"),
        "items": order.get("items", []),
        "subtotal": order.get("total_value", 0),
        "tax": round(order.get("total_value", 0) * 0.1, 2),
        "total": round(order.get("total_value", 0) * 1.1, 2),
        "approval": approval,
        "steps_completed": state.get("step_count", 0) + 1,
    }
    return {
        "invoice": invoice,
        "step_count": state.get("step_count", 0) + 1,
        "messages": [AIMessage(content=(
            f"[generate_invoice] 🧾 Invoice {invoice['invoice_id']} issued — "
            f"total=${invoice['total']:.2f} (incl. 10% tax), "
            f"status={invoice['status']}"
        ))],
    }


# ── Graph Construction ────────────────────────────────────────────
def create_advanced_graph():
    wf = StateGraph(OrderState)

    wf.add_node("parse_order", parse_order)
    wf.add_node("risk_assessment", risk_assessment)
    wf.add_node("manual_review", manual_review)
    wf.add_node("auto_approve", auto_approve)
    wf.add_node("generate_invoice", generate_invoice)

    wf.add_edge(START, "parse_order")
    wf.add_edge("parse_order", "risk_assessment")
    wf.add_conditional_edges(
        "risk_assessment",
        route_after_risk,
        {"auto_approve": "auto_approve", "manual_review": "manual_review"},
    )
    wf.add_edge("manual_review", "generate_invoice")
    wf.add_edge("auto_approve", "generate_invoice")
    wf.add_edge("generate_invoice", END)

    return wf.compile()


# Export
advanced_graph = create_advanced_graph()

