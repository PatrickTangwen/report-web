from pathlib import Path

from paper_context import PAPER_SOURCE, PAPER_TEXT
from research_data_release import public_release_metadata, validate_release


def test_research_result_release_matches_every_published_copy():
    manifest = validate_release(include_published=True)
    assert manifest["dataset_version"] == "research-results-mock-v1"
    assert manifest["status"] == "mock"


def test_public_release_metadata_is_explicit_and_path_free():
    metadata = public_release_metadata()
    assert metadata["status"] == "mock"
    assert metadata["datasets"]["evaluation_metrics"]["row_count"] == 350
    assert "filename" not in str(metadata)
    assert "sha256" not in str(metadata)


def test_paper_context_is_generated_from_the_published_aligatehr_gen_page():
    assert PAPER_SOURCE == "report/old-report.qmd"
    assert "ALIGATEHR-Gen" in PAPER_TEXT
    assert "Bio-ALIGATEHR" not in PAPER_TEXT
    assert Path(__file__).resolve().parents[1].joinpath(PAPER_SOURCE).is_file()
