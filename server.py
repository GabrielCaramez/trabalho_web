#!/usr/bin/env python3
"""Servidor local da DinoPédia: API HTTP + banco SQLite sem dependências externas."""
from __future__ import annotations

import json
import os
import re
import sqlite3
from urllib.error import URLError
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).parent
DATABASE = ROOT / "dinopedia.sqlite3"
UPSTREAM = "https://dinosaur-facts-api.shultzlab.com/dinosaurs"


def connection() -> sqlite3.Connection:
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def classify(name: str, description: str) -> tuple[str, str, str]:
    text = f"{name} {description}".lower()
    diet = "Herbívoro" if any(word in text for word in ("plant", "herb", "veget", "leaf", "graze")) else "Carnívoro"
    if any(word in text for word in ("pterosaur", "flying", "wing")):
        diet = "Voador"
    if any(word in text for word in ("marine", "ocean", "sea", "water")):
        diet = "Marinho"
    period = "Cretáceo" if any(word in text for word in ("cretaceous", "late cretaceous")) else "Jurássico"
    if "triassic" in text:
        period = "Triássico"
    region = "Mundo mesozoico"
    return diet, period, region


def seed_database() -> None:
    with connection() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS dinosaurs (
            id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT NOT NULL,
            diet TEXT NOT NULL, period TEXT NOT NULL, region TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""")
        if db.execute("SELECT COUNT(*) FROM dinosaurs").fetchone()[0] >= 100:
            return
        try:
            request = Request(UPSTREAM, headers={"User-Agent": "DinoPedia/1.0"})
            with urlopen(request, timeout=20) as response:
                records = json.load(response)
        except Exception as error:
            print(f"Aviso: não foi possível baixar o catálogo remoto: {error}")
            records = []
        if records:
            db.execute("DELETE FROM dinosaurs")
        elif db.execute("SELECT COUNT(*) FROM dinosaurs").fetchone()[0] == 0:
            records = [{"Name": "Tyrannosaurus rex", "Description": "Grande predador do Cretáceo."}]
        for item in records:
            name = str(item.get("Name", "")).strip()
            description = str(item.get("Description", "Sem descrição científica disponível.")).strip()
            if not name:
                continue
            diet, period, region = classify(name, description)
            db.execute(
                "INSERT OR IGNORE INTO dinosaurs (name, description, diet, period, region) VALUES (?, ?, ?, ?, ?)",
                (name, description, diet, period, region),
            )


def clean_query(value: str) -> str:
    return re.sub(r"[%_]", "", value).strip()[:80]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.startswith("/api/dinosaurs"):
            self.api_dinosaurs()
            return
        super().do_GET()

    def api_dinosaurs(self) -> None:
        params = parse_qs(urlsplit(self.path).query)
        search = clean_query(params.get("search", [""])[0])
        diet = clean_query(params.get("diet", ["Todos"])[0])
        try:
            limit = min(max(int(params.get("limit", ["120"])[0]), 1), 1000)
        except ValueError:
            limit = 120
        sql = "SELECT id, name, description, diet, period, region FROM dinosaurs WHERE 1=1"
        values: list[str | int] = []
        if search:
            sql += " AND (name LIKE ? OR description LIKE ?)"
            values.extend((f"%{search}%", f"%{search}%"))
        if diet != "Todos":
            sql += " AND diet = ?"
            values.append(diet)
        count_sql = sql.replace(
            "SELECT id, name, description, diet, period, region",
            "SELECT COUNT(*)",
        )
        sql += " ORDER BY name LIMIT ?"
        values.append(limit)
        with connection() as db:
            rows = [dict(row) for row in db.execute(sql, values)]
            total = db.execute(count_sql, values[:-1]).fetchone()[0]
        payload = json.dumps({"total": total, "items": rows}, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    seed_database()
    port = int(os.environ.get("DINOPEDIA_PORT", "4173"))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except OSError as error:
        if error.errno == 98:
            try:
                with urlopen(f"http://127.0.0.1:{port}/api/dinosaurs?limit=1", timeout=1) as response:
                    if response.status == 200:
                        print(f"DinoPédia já está em execução em http://localhost:{port}")
                        raise SystemExit(0)
            except (URLError, TimeoutError):
                pass
            raise SystemExit(
                f"Erro: a porta {port} já está sendo usada por outro programa. "
                f"Use DINOPEDIA_PORT=4174 python3 server.py."
            ) from error
        raise
    print(f"DinoPédia disponível em http://localhost:{port} ({DATABASE.name})")
    server.serve_forever()
