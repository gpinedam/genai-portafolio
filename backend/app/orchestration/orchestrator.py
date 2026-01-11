from typing import Any, Dict, List, Callable

from langchain.agents import create_agent
from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI

ToolHandler = Callable[..., Any]


class LangChainOrchestrator:
    def __init__(self, llm: ChatOpenAI, tools: List[Tool]):
        self.agent = create_agent(
            model=llm,
            tools=tools,
            system_prompt="Eres un orquestador de herramientas. Sé conciso y preciso."
        )

    def orchestrate(self, goal: str, context: Dict[str, Any]) -> Dict[str, Any]:
        user_message = f"{goal}\nContexto adicional: {context}"
        result = self.agent.invoke(
            {"messages": [{"role": "user", "content": user_message}]}
        )
        return result
