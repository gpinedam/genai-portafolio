# backend/main.py
from __future__ import annotations

from app.config.base import settings
from app.orchestration.orchestrator import LangChainOrchestrator
from langchain_openai import ChatOpenAI
from langchain.tools import tool

def main():
    llm = ChatOpenAI(
        api_key=settings.API_KEY,
        model=settings.AI_MODEL,
        temperature=float(settings.TEMPERATURE)
    )

    orchestrator = LangChainOrchestrator(llm)

    print("Chat iniciado. Escribe 'exit' para salir.")
    while True:
        user_input = input("Tú: ").strip()
        if user_input.lower() in ("exit", "salir"):
            break

        result = orchestrator.chat(user_input)
        final = result["messages"][-1].content
        print(f"Agente: {final}")


if __name__ == "__main__":
    main()
