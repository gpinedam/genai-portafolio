from typing import Any, Dict, Generator, List
from datetime import datetime
import queue
import threading

from langchain.agents import create_agent
from langchain_core.callbacks import BaseCallbackHandler
from langchain_openai import ChatOpenAI
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.orchestration.tools import build_tools


class StreamingCallbackHandler(BaseCallbackHandler):
    """Captures LLM tokens into a thread-safe queue for SSE streaming."""

    def __init__(self, q: queue.Queue) -> None:
        super().__init__()
        self.q = q
        self._capturing = False

    def on_llm_start(self, *args, **kwargs) -> None:
        # Reset buffer on every LLM call so we only stream the last one
        self._capturing = True

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        if self._capturing:
            self.q.put(token)

    def on_llm_end(self, *args, **kwargs) -> None:
        self._capturing = False

    def on_llm_error(self, error: BaseException, **kwargs) -> None:
        self.q.put(error)


prompt_dir = Path(__file__).parent / "prompt"
env = Environment(
    loader = FileSystemLoader(prompt_dir),
    autoescape = select_autoescape([])
)

def render_prompts(context: dict, file_prompt: str)-> str:
        template = env.get_template(file_prompt)
        return template.render(context)

context_system_prompt = {
     "project": "GenIA Portafolio",
     "fecha_actual": datetime.now().strftime("%d-%m-%Y")
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

    def chat_stream(self, user_input: str) -> Generator[str, None, None]:
        """Yield LLM tokens as they are produced using a background thread + queue."""
        self.messages.append({"role": "user", "content": user_input})

        q: queue.Queue = queue.Queue()
        handler = StreamingCallbackHandler(q)
        _SENTINEL = object()

        def _run() -> None:
            try:
                result = self.agent.invoke(
                    {"messages": self.messages},
                    config={"callbacks": [handler]},
                )
                self.messages = result["messages"]
            except Exception as exc:
                q.put(exc)
            finally:
                q.put(_SENTINEL)

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()

        try:
            while True:
                item = q.get(timeout=60)
                if item is _SENTINEL:
                    break
                if isinstance(item, BaseException):
                    raise item
                yield item
        finally:
            thread.join(timeout=5)