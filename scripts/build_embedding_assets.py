#!/usr/bin/env python3
"""Build and verify browser-optimized embedding assets."""

import argparse
import hashlib
import json
import statistics
import tempfile
import time
from pathlib import Path

import pyarrow.csv as arrow_csv
import pyarrow.ipc as arrow_ipc


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "viz/data/patient_embeddings.csv"
OUTPUT = ROOT / "viz/data/patient_embeddings.arrow"
MANIFEST = ROOT / "viz/data/embedding_assets_manifest.json"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_arrow(output):
    table = arrow_csv.read_csv(SOURCE)
    with output.open("wb") as sink:
        with arrow_ipc.new_file(sink, table.schema) as writer:
            writer.write_table(table)
    return table


def manifest_for(output, table):
    return {
        "schema_version": "embedding-assets-v1",
        "source": "patient_embeddings.csv",
        "source_sha256": sha256(SOURCE),
        "asset": "patient_embeddings.arrow",
        "asset_sha256": sha256(output),
        "format": "Arrow IPC file, uncompressed",
        "rows": table.num_rows,
        "columns": table.column_names,
        "source_bytes": SOURCE.stat().st_size,
        "asset_bytes": output.stat().st_size,
        "size_ratio": round(output.stat().st_size / SOURCE.stat().st_size, 4),
    }


def benchmark(rounds=5):
    arrow_csv.read_csv(SOURCE)
    arrow_ipc.open_file(OUTPUT).read_all()

    csv_times = []
    arrow_times = []
    for _ in range(rounds):
        started = time.perf_counter()
        arrow_csv.read_csv(SOURCE)
        csv_times.append(time.perf_counter() - started)

        started = time.perf_counter()
        arrow_ipc.open_file(OUTPUT).read_all()
        arrow_times.append(time.perf_counter() - started)

    csv_median = statistics.median(csv_times)
    arrow_median = statistics.median(arrow_times)
    print(
        "Embedding parse benchmark: "
        f"CSV {csv_median * 1000:.1f} ms, "
        f"Arrow {arrow_median * 1000:.1f} ms, "
        f"{csv_median / arrow_median:.1f}x faster (median of {rounds})."
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--benchmark", action="store_true")
    args = parser.parse_args()

    if args.check:
        with tempfile.TemporaryDirectory() as directory:
            candidate = Path(directory) / OUTPUT.name
            table = write_arrow(candidate)
            expected_manifest = manifest_for(candidate, table)
            if not OUTPUT.exists() or OUTPUT.read_bytes() != candidate.read_bytes():
                raise SystemExit("Arrow asset drifted. Run `pnpm run build:embeddings`.")
            if not MANIFEST.exists() or json.loads(MANIFEST.read_text()) != expected_manifest:
                raise SystemExit("Embedding asset manifest drifted.")
        print("Embedding Arrow asset is current.")
    else:
        table = write_arrow(OUTPUT)
        MANIFEST.write_text(json.dumps(manifest_for(OUTPUT, table), indent=2) + "\n")
        print(f"Wrote {OUTPUT.relative_to(ROOT)} and {MANIFEST.relative_to(ROOT)}")

    if args.benchmark:
        benchmark()


if __name__ == "__main__":
    main()
