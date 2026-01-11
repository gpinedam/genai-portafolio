project-root/
├── backend/
│   ├── app/
│   │   ├── main.py              # Flask app factory
│   │   ├── wsgi.py              # Producción
│   │   ├── __init__.py
│   │
│   │   ├── config/
│   │   │   ├── base.py
│   │   │   └── production.py
│   │
│   │   ├── domain/              # Lógica de negocio pura
│   │   │   ├── entities/
│   │   │   ├── use_cases/
│   │   │   └── errors/
│   │
│   │   ├── orchestration/       # GenAI orchestration
│   │   │   ├── agent_orchestrator.py
│   │   │   └── policies.py
│   │
│   │   ├── integrations/
│   │   │   ├── llm/
│   │   │   ├── memory/
│   │   │   └── mcp_clients/
│   │
│   │   ├── api/                 # REST / HTTP
│   │   │   ├── routes/
│   │   │   ├── schemas/
│   │   │   └── middlewares/
│   │
│   │   ├── services/            # Logging, metrics, etc.
│   │   └── utils/
│   │
│   └── tests/
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   │
│   └── README.md
│
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
│
├── .env
├── README.md
└── Makefile