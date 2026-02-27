import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import get_settings

settings = get_settings()
TABLE_NAME = "predictions_v2"

_conn: sqlite3.Connection | None = None
_db_ready = False


def _ensure_column(column_name: str, column_def: str) -> None:
    if _conn is None:
        return
    existing = _conn.execute(f"PRAGMA table_info({TABLE_NAME})").fetchall()
    existing_names = {row["name"] for row in existing}
    if column_name not in existing_names:
        _conn.execute(f"ALTER TABLE predictions ADD COLUMN {column_name} {column_def}")


def init_db() -> None:
    global _conn, _db_ready

    try:
        db_path = Path(settings.sqlite_db_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)

        _conn = sqlite3.connect(db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area TEXT NOT NULL,
                item TEXT NOT NULL,
                year INTEGER NOT NULL,
                average_rain_fall_mm_per_year REAL NOT NULL,
                pesticides_tonnes REAL NOT NULL,
                avg_temp REAL NOT NULL,
                farm_area_hectares REAL NOT NULL,
                predicted_yield_hg_ha REAL NOT NULL,
                predicted_yield_t_ha REAL NOT NULL,
                risk_level TEXT NOT NULL,
                warnings TEXT NOT NULL,
                expected_production_tons REAL DEFAULT 0,
                food_security_level TEXT DEFAULT 'Watch',
                food_security_notes TEXT DEFAULT '[]',
                planting_schedule TEXT DEFAULT '{}',
                advisory TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        _conn.execute(
            f"CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_created_at ON {TABLE_NAME} (created_at DESC)"
        )
        _ensure_column("area", "TEXT DEFAULT ''")
        _ensure_column("item", "TEXT DEFAULT ''")
        _ensure_column("year", "INTEGER DEFAULT 2000")
        _ensure_column("average_rain_fall_mm_per_year", "REAL DEFAULT 0")
        _ensure_column("pesticides_tonnes", "REAL DEFAULT 0")
        _ensure_column("avg_temp", "REAL DEFAULT 0")
        _ensure_column("farm_area_hectares", "REAL DEFAULT 1")
        _ensure_column("predicted_yield_hg_ha", "REAL DEFAULT 0")
        _ensure_column("predicted_yield_t_ha", "REAL DEFAULT 0")
        _ensure_column("expected_production_tons", "REAL DEFAULT 0")
        _ensure_column("food_security_level", "TEXT DEFAULT 'Watch'")
        _ensure_column("food_security_notes", "TEXT DEFAULT '[]'")
        _ensure_column("planting_schedule", "TEXT DEFAULT '{}'")
        _conn.commit()
        _db_ready = True
    except sqlite3.Error:
        _db_ready = False
        _conn = None


def db_is_ready() -> bool:
    return _db_ready


def save_prediction(record: dict[str, Any]) -> str | None:
    if _conn is None:
        return None

    created_at = datetime.now(timezone.utc).isoformat()
    warnings_json = json.dumps(record.get("warnings", []))
    food_security_notes_json = json.dumps(record.get("food_security_notes", []))
    planting_schedule_json = json.dumps(record.get("planting_schedule", {}))

    try:
        cursor = _conn.execute(
            """
            INSERT INTO predictions_v2 (
                area, item, year, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp,
                farm_area_hectares, predicted_yield_hg_ha, predicted_yield_t_ha, risk_level,
                warnings, expected_production_tons, food_security_level, food_security_notes,
                planting_schedule, advisory, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["area"],
                record["item"],
                record["year"],
                record["average_rain_fall_mm_per_year"],
                record["pesticides_tonnes"],
                record["avg_temp"],
                record["farm_area_hectares"],
                record["predicted_yield_hg_ha"],
                record["predicted_yield_t_ha"],
                record["risk_level"],
                warnings_json,
                record.get("expected_production_tons", 0.0),
                record.get("food_security_level", "Watch"),
                food_security_notes_json,
                planting_schedule_json,
                record["advisory"],
                created_at,
            ),
        )
        _conn.commit()
        return str(cursor.lastrowid)
    except (sqlite3.Error, KeyError):
        return None


def get_recent_predictions(limit: int = 20) -> list[dict[str, Any]]:
    if _conn is None:
        return []

    safe_limit = min(max(limit, 1), 100)
    try:
        rows = _conn.execute(
            """
            SELECT area, item, year, predicted_yield_hg_ha, predicted_yield_t_ha, risk_level, created_at
            FROM predictions_v2
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    except sqlite3.Error:
        return []

    normalized: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        normalized.append(
            {
                "area": str(item.get("area", "")),
                "item": str(item.get("item", "")),
                "year": int(item.get("year") or 2000),
                "predicted_yield_hg_ha": float(item.get("predicted_yield_hg_ha") or 0.0),
                "predicted_yield_t_ha": float(item.get("predicted_yield_t_ha") or 0.0),
                "risk_level": str(item.get("risk_level") or "Medium"),
                "created_at": item.get("created_at"),
            }
        )

    return normalized
