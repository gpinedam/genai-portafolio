from typing import Any, Dict, List

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.orchestration.tools import build_tools


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
        self.tools = build_tools()
        self.agent = create_agent(
            model=self.llm,
            tools=self.tools,
            system_prompt=system_prompt
        )

        # Estado conversacional (mensajes acumulados)
        self.messages: List[Dict[str, str]] = []

    def chat(self, user_input: str) -> Dict[str, Any]:
        # Añadir el mensaje del usuario al historial
        self.messages.append({"role": "user", "content": user_input})

        # Invocar agente con el historial completo
        result = self.agent.invoke({"messages": self.messages})

        # El agente devuelve el state completo; usamos sus messages como historial actualizado
        self.messages = result["messages"]
        return result