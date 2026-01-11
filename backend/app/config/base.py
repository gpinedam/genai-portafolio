from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

# AI SERVICES
PROJECT_NAME = os.getenv("PROJECT_NAME", "Portafolio GenAI")
API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")
TEMPERATURE = os.getenv("OPENAI_TEMPERATURE", 0)
LIMIT_TOKENS = os.getenv("OPENAI_LIMIT_TOKENS", 20000)

# PROJECT CONFIGURATION
LIMIT_QUESTIONS = os.getenv("LIMIT_QUESTIONS", 10)
