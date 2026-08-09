#!/usr/bin/env python3
"""Export the FastAPI schema deterministically for frontend client generation."""

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "chatbot-backend"
OUTPUT = ROOT / "frontend" / "generated" / "openapi.json"


def rendered_schema():
    sys.path.insert(0, str(BACKEND))
    from app import app

    return json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if the committed schema differs from the FastAPI app",
    )
    args = parser.parse_args()

    rendered = rendered_schema()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != rendered:
            raise SystemExit(
                "OpenAPI schema drift detected. Run `pnpm run generate:api`."
            )
        print(f"OpenAPI schema is current: {OUTPUT.relative_to(ROOT)}")
        return

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(rendered)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
