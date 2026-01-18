from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DummyMessage:
    content: str


class DummyOrchestrator:
    def __init__(self, reply: str) -> None:
        self.reply = reply

    def chat(self, user_input: str) -> dict:
        return {"messages": [DummyMessage(content=user_input), DummyMessage(content=self.reply)]}


def test_health(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_chat_requires_message(client):
    response = client.post("/api/v1/chat", json={})

    assert response.status_code == 400
    assert response.get_json() == {"error": "message is required"}


def test_chat_success_returns_reply_and_session_id(client, monkeypatch):
    from app.api.v1 import routes

    def _dummy_get_orchestrator(_session_id: str) -> DummyOrchestrator:
        return DummyOrchestrator(reply="Hola desde pruebas")

    monkeypatch.setattr(routes, "_get_orchestrator", _dummy_get_orchestrator)

    response = client.post("/api/v1/chat", json={"message": "Hola", "session_id": "test123"})

    assert response.status_code == 200
    assert response.get_json() == {"reply": "Hola desde pruebas", "session_id": "test123"}
