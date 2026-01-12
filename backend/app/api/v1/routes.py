from __future__ import annotations

from typing import Dict
from uuid import uuid4

from flask import Blueprint, jsonify, request
from langchain_openai import ChatOpenAI

from app.config.base import settings
from app.orchestration.orchestrator import LangChainOrchestrator


api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

_sessions: Dict[str, LangChainOrchestrator] = {}


def _build_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.API_KEY,
        model=settings.AI_MODEL,
        temperature=float(settings.TEMPERATURE),
    )


def _get_orchestrator(session_id: str) -> LangChainOrchestrator:
    orchestrator = _sessions.get(session_id)
    if orchestrator is None:
        orchestrator = LangChainOrchestrator(_build_llm())
        _sessions[session_id] = orchestrator
    return orchestrator


@api_v1.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@api_v1.post("/chat")
def chat() -> tuple:
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    session_id = payload.get("session_id") or uuid4().hex
    orchestrator = _get_orchestrator(session_id)
    result = orchestrator.chat(message)
    reply = result["messages"][-1].content

    return jsonify({"reply": reply, "session_id": session_id}), 200
