"""Versioned authority for the public/mock research-result datasets."""

import csv
import hashlib
import json
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_ROOT.parent
DATA_DIR = BACKEND_ROOT / "data"
MANIFEST_PATH = DATA_DIR / "research_results_manifest.json"


def load_release_manifest():
    with MANIFEST_PATH.open(encoding="utf-8") as file:
        manifest = json.load(file)
    if manifest.get("schema_version") != "research-data-release-v1":
        raise RuntimeError("Unsupported research data release manifest")
    if manifest.get("status") not in {"mock", "published"}:
        raise RuntimeError("Research data release must declare mock or published status")
    return manifest


def research_data_path(dataset_name):
    manifest = load_release_manifest()
    try:
        filename = manifest["datasets"][dataset_name]["filename"]
    except KeyError as error:
        raise KeyError(f"Unknown research dataset: {dataset_name}") from error
    return DATA_DIR / filename


def _sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _validate_dataset(dataset_name, contract, include_published):
    source = DATA_DIR / contract["filename"]
    if not source.is_file():
        raise RuntimeError(f"Research dataset is missing: {source}")
    if _sha256(source) != contract["sha256"]:
        raise RuntimeError(f"Research dataset checksum drifted: {dataset_name}")

    with source.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames != contract["columns"]:
            raise RuntimeError(f"Research dataset schema drifted: {dataset_name}")
        rows = list(reader)
    if len(rows) != contract["row_count"]:
        raise RuntimeError(f"Research dataset row count drifted: {dataset_name}")

    keys = [
        tuple(row[column] for column in contract["primary_key"])
        for row in rows
    ]
    if len(keys) != len(set(keys)):
        raise RuntimeError(f"Research dataset primary key is not unique: {dataset_name}")

    if include_published:
        published = REPO_ROOT / contract["published_copy"]
        if not published.is_file() or published.read_bytes() != source.read_bytes():
            raise RuntimeError(f"Published research dataset is out of sync: {dataset_name}")


def validate_release(include_published=False):
    manifest = load_release_manifest()
    for dataset_name, contract in manifest["datasets"].items():
        _validate_dataset(dataset_name, contract, include_published)
    return manifest


def public_release_metadata():
    manifest = load_release_manifest()
    return {
        "schema_version": manifest["schema_version"],
        "dataset_version": manifest["dataset_version"],
        "released_on": manifest["released_on"],
        "status": manifest["status"],
        "description": manifest["description"],
        "datasets": {
            name: {
                "row_count": contract["row_count"],
                "columns": contract["columns"],
            }
            for name, contract in manifest["datasets"].items()
        },
    }
