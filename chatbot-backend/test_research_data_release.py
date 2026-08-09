from paper_context import PAPER_SOURCE, PAPER_SOURCE_SHA256, PAPER_TEXT
from research_data_release import public_release_metadata, validate_release


def test_research_result_release_matches_its_versioned_contract():
    manifest = validate_release(include_published=False)
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
    assert len(PAPER_SOURCE_SHA256) == 64
    assert set(PAPER_SOURCE_SHA256) <= set("0123456789abcdef")
    assert "ALIGATEHR-Gen" in PAPER_TEXT
    assert "Bio-ALIGATEHR" not in PAPER_TEXT
