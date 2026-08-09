#!/usr/bin/env python3
"""Synchronize public visualization CSVs from the backend data authority."""

import argparse
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "chatbot-backend"))

from research_data_release import DATA_DIR, load_release_manifest, validate_release


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail instead of writing when a published copy is out of sync.",
    )
    args = parser.parse_args()

    manifest = validate_release(include_published=False)
    drifted = []
    for dataset_name, contract in manifest["datasets"].items():
        source = DATA_DIR / contract["filename"]
        target = ROOT / contract["published_copy"]
        if target.is_file() and target.read_bytes() == source.read_bytes():
            continue
        drifted.append(dataset_name)
        if not args.check:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)

    if args.check and drifted:
        print("Research data release check failed:", file=sys.stderr)
        for dataset_name in drifted:
            print(f"  - {dataset_name}: published copy is out of sync", file=sys.stderr)
        return 1

    validate_release(include_published=True)
    action = "already synchronized" if not drifted else "synchronized"
    print(
        f"Research data release {manifest['dataset_version']} {action} "
        f"({manifest['status']})."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
