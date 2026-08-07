import json
from pathlib import Path

from agent_tools import TOOLS

GOLDEN_PATH = Path(__file__).parent / "eval" / "golden_set.jsonl"

CATEGORY_RANGES = {
    "single_tool": (12, 15),
    "multi_tool": (10, 12),
    "adversarial": (6, 8),
    "ambiguous": (5, 6),
}


def _items():
    with open(GOLDEN_PATH) as file:
        return [json.loads(line) for line in file if line.strip()]


def test_golden_set_items_are_well_formed():
    items = _items()
    assert 30 <= len(items) <= 50
    ids = [item["id"] for item in items]
    assert len(ids) == len(set(ids))
    for item in items:
        assert item["question"].strip()
        assert item["golden_answer"].strip()
        assert item["grading_notes"].strip()
        assert item["category"] in CATEGORY_RANGES
        assert set(item["expected_tools"]) <= set(TOOLS)


def test_golden_set_category_counts_match_spec():
    items = _items()
    for category, (low, high) in CATEGORY_RANGES.items():
        count = sum(1 for item in items if item["category"] == category)
        assert low <= count <= high, f"{category}: {count} not in [{low}, {high}]"


def test_tool_expectations_follow_category_semantics():
    for item in _items():
        if item["category"] in ("single_tool", "multi_tool"):
            assert item["expected_tools"], item["id"]
        else:
            assert item["expected_tools"] == [], item["id"]
