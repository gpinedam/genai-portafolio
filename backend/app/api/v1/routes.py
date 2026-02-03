from __future__ import annotations

from typing import Dict
from uuid import uuid4
from pathlib import Path
import csv

from flask import Blueprint, jsonify, request
from langchain_openai import ChatOpenAI

from app.config.base import settings
from app.orchestration.orchestrator import LangChainOrchestrator
from app.core.rate_limiter import RateLimiter


api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

_sessions: Dict[str, LangChainOrchestrator] = {}
_rate_limiter = RateLimiter(
    max_questions=settings.MAX_QUESTIONS_PER_USER,
    window_hours=settings.RATE_LIMIT_WINDOW_HOURS
)


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

    # Obtener IP del cliente
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if client_ip:
        # En caso de múltiples IPs (proxies), tomar la primera
        client_ip = client_ip.split(",")[0].strip()
    
    # Verificar límite de rate
    can_proceed, error_message = _rate_limiter.check_limit(client_ip)
    
    if not can_proceed:
        remaining = _rate_limiter.get_remaining_questions(client_ip)
        return jsonify({
            "error": error_message,
            "remaining_questions": remaining,
            "rate_limited": True
        }), 429
    
    # Incrementar contador antes de procesar
    _rate_limiter.increment(client_ip)
    
    session_id = payload.get("session_id") or uuid4().hex
    orchestrator = _get_orchestrator(session_id)
    result = orchestrator.chat(message)
    reply = result["messages"][-1].content
    
    # Obtener preguntas restantes para informar al usuario
    remaining = _rate_limiter.get_remaining_questions(client_ip)

    return jsonify({
        "reply": reply,
        "session_id": session_id,
        "remaining_questions": remaining
    }), 200


@api_v1.get("/contacts")
def get_contacts() -> tuple:
    """Devuelve los contactos guardados en el CSV."""
    csv_path = Path("storage/info-table-genai.csv")
    
    if not csv_path.exists():
        return jsonify({"contacts": []}), 200
    
    contacts = []
    try:
        with csv_path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                contacts.append({
                    "nombres": row.get("nombres", ""),
                    "apellidos": row.get("apellidos", ""),
                    "correo": row.get("correo", ""),
                    "telefono": row.get("telefono", "")
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"contacts": contacts}), 200
