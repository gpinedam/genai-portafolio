from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, abort, send_from_directory
from flask_cors import CORS

from app.api.v1.routes import api_v1

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = Path(os.getenv("FRONTEND_DIR", str(ROOT_DIR / "frontend")))


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.register_blueprint(api_v1)

    @app.get("/")
    def index() -> object:
        return send_from_directory(str(FRONTEND_DIR), "index.html")

    @app.get("/<path:filename>")
    def frontend_assets(filename: str) -> object:
        file_path = FRONTEND_DIR / filename
        if file_path.is_file():
            return send_from_directory(str(FRONTEND_DIR), filename)
        abort(404)

    return app


def main() -> None:
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "8000"))
    create_app().run(host=host, port=port)


if __name__ == "__main__":
    main()
