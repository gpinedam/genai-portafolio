from typing import Any, Dict, List
from langchain.agents import initialize_agent, Tool, AgentExecutor, AgentType
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI

# define LangChain-compatible tools (handlers should be synchronous)
tools = [
    Tool(
        name="generate_report",
        func=generate_report_handler,
        description="Genera un reporte según los parámetros suministrados."
    ),
    Tool(
        name="fetch_metrics",
        func=fetch_metrics_handler,
        description="Recupera métricas del backend para el contexto dado."
    ),
]

class LangChainOrchestrator:
    def __init__(self, llm: ChatOpenAI, tools: List[Tool]):
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        self.agent: AgentExecutor = initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            memory=self.memory,
        )

    def orchestrate(self, goal: str, context: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"{goal}\nContexto adicional: {context}"
        response = self.agent.run(input=prompt)
        return {"response": response, "history": self.memory.load_memory_variables({})}
