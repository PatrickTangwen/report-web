import csv
import json
from collections import Counter
from pathlib import Path

import pytest

from fibrotic_contract import MATCH_FIELDS, TARGETS


DATA_DIR = Path(__file__).parent / "data"


@pytest.fixture
def synthetic_matching_release():
    """Build a display-linked matching release without private cohort data."""
    selected = []
    counts = Counter()
    display_path = DATA_DIR / "fibrotic_release" / "fibrotic_embedding.csv"

    with display_path.open(newline="") as file:
        for display_row in csv.DictReader(file):
            target = display_row["disease"]
            if target not in TARGETS or counts[target] >= 5:
                continue
            row = {field: "" for field in MATCH_FIELDS}
            row.update(
                visual_reference_id=display_row["visual_reference_id"],
                disease=target,
                age_recruit=str(50 + counts[target]),
                sex="0",
                BMI="25",
                waist="80",
                hip="100",
                height="170",
                weight="72",
                DBP="80",
                SBP="120",
                creatinine="90",
                HbA1c="40",
                smoking_status="0",
                alcohol_freq="3",
                has_affected_rel="0",
            )
            selected.append(row)
            counts[target] += 1

    assert set(counts) == TARGETS
    assert set(counts.values()) == {5}
    calibration = json.loads(
        (DATA_DIR / "fibrotic_matching_calibration.json").read_text()
    )
    return {
        "dataset_version": calibration["dataset_version"],
        "rows": selected,
        "calibration": calibration,
    }
