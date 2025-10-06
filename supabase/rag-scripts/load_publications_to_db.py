"""Ingest NASA bio science embeddings into the research.publication_chunks table.

Usage::

    export SUPABASE_DB_URL="postgresql://postgres:<password>@<host>:5432/postgres"
    export HF_PUBLICATIONS_JSONL="/path/to/publications_with_cohere_v4_embeddings.jsonl"
    python supabase/rag_scripts/load_publications_to_db.py

The script is idempotent: existing (pmcid, chunk_index) rows are updated in-place.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

import psycopg
from psycopg.rows import tuple_row
from tqdm import tqdm

BATCH_SIZE = 200
EXPECTED_DIM = 512


def _format_float(value: float) -> str:
    text = f"{value:.10f}".rstrip("0").rstrip(".")
    return text if text else "0"


def adapt_embedding(values: Sequence[float]) -> str:
    return "[" + ",".join(_format_float(v) for v in values) + "]"


def load_records(jsonl_path: Path) -> Iterable[Tuple[str, str | None, str | None, int, str, object]]:
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Line {line_no}: invalid JSON") from exc

            pmcid = str(payload.get("pmcid")) if payload.get("pmcid") else None
            if not pmcid:
                raise ValueError(f"Line {line_no}: missing pmcid")

            try:
                chunk_index = int(payload.get("chunk_index"))
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Line {line_no}: chunk_index must be an integer") from exc

            text = payload.get("text") or payload.get("chunk")
            if not isinstance(text, str) or not text.strip():
                raise ValueError(f"Line {line_no}: missing text payload")

            embedding_raw = payload.get("embedding")
            if not isinstance(embedding_raw, Sequence):
                raise ValueError(f"Line {line_no}: embedding must be a sequence")

            embedding: List[float] = []
            for value in embedding_raw:
                try:
                    embedding.append(float(value))
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Line {line_no}: embedding contains non-numeric value") from exc

            if len(embedding) != EXPECTED_DIM:
                raise ValueError(
                    f"Line {line_no}: embedding length {len(embedding)} does not match expected dimension {EXPECTED_DIM}"
                )

            yield (
                pmcid,
                payload.get("title"),
                payload.get("url"),
                chunk_index,
                text,
                adapt_embedding(embedding),
            )


def main() -> None:
    database_url = os.getenv("SUPABASE_DB_URL")
    jsonl_path_value = os.getenv("HF_PUBLICATIONS_JSONL")

    if not database_url:
        print("SUPABASE_DB_URL is required", file=sys.stderr)
        sys.exit(1)

    if not jsonl_path_value:
        print("HF_PUBLICATIONS_JSONL is required", file=sys.stderr)
        sys.exit(1)

    jsonl_path = Path(jsonl_path_value).expanduser()
    if not jsonl_path.exists():
        print(f"JSONL file not found: {jsonl_path}", file=sys.stderr)
        sys.exit(1)

    sql = (
        "INSERT INTO research.publication_chunks (pmcid, title, url, chunk_index, chunk, embedding) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "ON CONFLICT (pmcid, chunk_index) DO UPDATE SET "
        "title = EXCLUDED.title, "
        "url = EXCLUDED.url, "
        "chunk = EXCLUDED.chunk, "
        "embedding = EXCLUDED.embedding, "
        "updated_at = NOW()"
    )

    with psycopg.connect(database_url, autocommit=False) as conn:
        conn.prepare_threshold = None  # Avoid PgBouncer conflicts with server-side prepared statements.
        with conn.cursor(row_factory=tuple_row) as cur:
            batch: List[Tuple[str, str | None, str | None, int, str, object]] = []
            for record in tqdm(load_records(jsonl_path), desc="Uploading chunks"):
                batch.append(record)
                if len(batch) >= BATCH_SIZE:
                    cur.executemany(sql, batch)
                    conn.commit()
                    batch.clear()
            if batch:
                cur.executemany(sql, batch)
                conn.commit()

    print("✅ Upload complete")


if __name__ == "__main__":
    main()
