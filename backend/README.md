project-root/
├── backend/
│   ├── app/
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
│   ├── main.py                  # Flask app factory
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
