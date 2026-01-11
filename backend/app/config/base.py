from pathlib import Path
from dotenv import load_dotenv
import os

class Settings:
    def __init__(self):
        # Localizar y cargar el archivo .env
        env_path = Path(__file__).resolve().parents[2] / ".env"
        load_dotenv(env_path)

        # AI SERVICES
        self.PROJECT_NAME = os.getenv("PROJECT_NAME", "Portafolio GenAI")
        self.API_KEY = os.getenv("OPENAI_API_KEY", "")
        self.AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")
        self.TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0"))
        self.LIMIT_TOKENS = int(os.getenv("LIMIT_TOKENS", "20000"))

        # PROJECT CONFIGURATION
        self.LIMIT_QUESTIONS = int(os.getenv("LIMIT_QUESTIONS", "10"))

# Instanciamos el objeto para que esté listo al importar
settings = Settings()
