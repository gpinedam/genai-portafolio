from typing import Any, Dict, List

from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

prompt_dir = Path(__file__).parent / "prompt"
env = Environment(
    loader = FileSystemLoader(prompt_dir),
    autoescape = select_autoescape([])
)

def render_prompts(context: dict, file_prompt: str)-> str:
        template = env.get_template(file_prompt)
        return template.render(context)

context_system_prompt = {
     "project": "GenIA Portafolio"
}
system_prompt = render_prompts(context_system_prompt, "system_prompt.jinja")

class LangChainOrchestrator:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm
        self.tools = self._build_tools()
        self.agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=system_prompt
        )

        # Estado conversacional (mensajes acumulados)
        self.messages: List[Dict[str, str]] = []

    def _build_tools(self):
        @tool("generate_report", description="Genera un reporte según los parámetros suministrados.")
        def generate_report_handler(topic: str, format: str = "summary") -> dict:
            return {"ok": True, "topic": topic, "format": format, "report": "Reporte demo código ALL GOOD"}

        @tool("fetch_metrics", description="Recupera métricas del backend para el contexto dado.")
        def fetch_metrics_handler(metric: str, window: str = "24h") -> dict:
            return {"ok": True, "metric": metric, "window": window, "value": 120}

        return [generate_report_handler, fetch_metrics_handler]

    def chat(self, user_input: str) -> Dict[str, Any]:
        # Añadir el mensaje del usuario al historial
        self.messages.append({"role": "user", "content": user_input})

        # Invocar agente con el historial completo
        result = self.agent.invoke({"messages": self.messages})

        # El agente devuelve el state completo; usamos sus messages como historial actualizado
        self.messages = result["messages"]
        return result