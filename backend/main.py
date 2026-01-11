# backend/main.py
from __future__ import annotations

from app.config.base import settings
from app.orchestration.orchestrator import LangChainOrchestrator
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool("generate_report", 
      description="Genera un reporte según los parámetros suministrados.")
def generate_report_handler(topic: str, format: str = "summary") -> dict:
    return {
        "ok": True,
        "topic": topic,
        "format": format,
        "report": "Reporte demo"
    }

@tool("fetch_metrics", 
      description="Recupera métricas del backend para el contexto dado.")
def fetch_metrics_handler(metric: str, window: str = "24h") -> dict:
    return {
        "ok": True,
        "metric": metric,
        "window": window,
        "value": 120
    }

def main():
    llm = ChatOpenAI(api_key=settings.API_KEY, model=settings.AI_MODEL, temperature=float(settings.TEMPERATURE))
    tools = [generate_report_handler, fetch_metrics_handler]
    orchestrator = LangChainOrchestrator(llm, tools)

    goal = "Genera un reporte de estado del sistema"
    context = {"user": "george", "scope": "demo"}
    result = orchestrator.orchestrate(goal, context)
    print(result)


if __name__ == "__main__":
    main()
