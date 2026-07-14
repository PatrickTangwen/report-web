import json
import re
from pathlib import Path


VOCABULARY_PATH = Path(__file__).with_name("data") / "icd_keyword_vocabulary.json"
SELECTOR_TYPES = {"exact", "prefix", "range"}


def normalize_code(value):
    return re.sub(r"[^A-Z0-9]", "", str(value).upper())


def selector_matches_code(selector, code):
    normalized = normalize_code(code)
    selector_type = selector.get("type")
    if selector_type == "exact":
        return normalized == normalize_code(selector.get("code", ""))
    if selector_type == "prefix":
        prefix = normalize_code(selector.get("prefix", ""))
        return bool(prefix) and normalized.startswith(prefix)
    if selector_type == "range":
        category = normalized[:3]
        start = normalize_code(selector.get("start", ""))[:3]
        end = normalize_code(selector.get("end", ""))[:3]
        return len(category) == 3 and len(start) == 3 and len(end) == 3 and start <= category <= end
    return False


def load_icd_vocabulary(path=VOCABULARY_PATH):
    with Path(path).open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_vocabulary(vocabulary, codes):
    errors = []
    seen_ids = set()
    seen_terms = {}
    normalized_codes = [normalize_code(code) for code in codes]

    for entry in vocabulary.get("entries", []):
        entry_id = entry.get("id")
        if not entry_id or entry_id in seen_ids:
            errors.append(f"Vocabulary entry has a missing or duplicate id: {entry_id!r}")
        seen_ids.add(entry_id)

        if entry.get("icd_version") != vocabulary.get("icd_version"):
            errors.append(f"{entry_id}: ICD version does not match vocabulary metadata")
        if not entry.get("source"):
            errors.append(f"{entry_id}: source is required")

        selector = entry.get("selector", {})
        if selector.get("type") not in SELECTOR_TYPES:
            errors.append(f"{entry_id}: selector type is unsupported")
        elif not any(selector_matches_code(selector, code) for code in normalized_codes):
            errors.append(f"{entry_id}: selector matches no tracked ICD embedding codes")

        terms = [entry.get("canonical_keyword"), *entry.get("aliases", [])]
        for term in terms:
            normalized_term = normalize_keyword(term)
            if not normalized_term:
                errors.append(f"{entry_id}: keyword or alias is empty")
                continue
            owner = seen_terms.get(normalized_term)
            if owner and owner != entry_id:
                errors.append(
                    f"{entry_id}: keyword {normalized_term!r} is also assigned to {owner}"
                )
            seen_terms[normalized_term] = entry_id

    return errors


def normalize_keyword(value):
    return " ".join(re.findall(r"[a-z0-9]+", str(value).lower()))


def _public_match(entry, matched_keyword):
    return {
        "id": entry["id"],
        "canonical_keyword": entry["canonical_keyword"],
        "matched_keyword": matched_keyword,
        "display_label": entry["display_label"],
        "selector": dict(entry["selector"]),
        "selector_label": entry["selector_label"],
    }


def match_icd_keywords(message, vocabulary=None):
    vocabulary = vocabulary or load_icd_vocabulary()
    normalized_message = normalize_keyword(message)
    candidates = []

    for entry in vocabulary.get("entries", []):
        terms = [entry.get("canonical_keyword"), *entry.get("aliases", [])]
        seen_terms = set()
        for term in terms:
            normalized_term = normalize_keyword(term)
            if not normalized_term or normalized_term in seen_terms:
                continue
            seen_terms.add(normalized_term)
            pattern = rf"(?<![a-z0-9]){re.escape(normalized_term)}(?![a-z0-9])"
            for occurrence in re.finditer(pattern, normalized_message):
                candidates.append(
                    {
                        "start": occurrence.start(),
                        "end": occurrence.end(),
                        "term": normalized_term,
                        "entry": entry,
                    }
                )

    grouped = {}
    for candidate in candidates:
        key = (candidate["start"], candidate["end"], candidate["term"])
        entries = grouped.setdefault(key, {})
        entries[candidate["entry"]["id"]] = candidate["entry"]

    ambiguities = []
    for (start, _, term), entries in sorted(grouped.items()):
        if len(entries) < 2:
            continue
        ambiguities.append(
            {
                "matched_keyword": term,
                "position": start,
                "options": [
                    _public_match(entry, term)
                    for entry in sorted(entries.values(), key=lambda item: item["id"])
                ],
            }
        )

    base = {
        "vocabulary_version": vocabulary.get("version"),
        "matches": [],
        "ambiguities": ambiguities,
    }
    if ambiguities:
        return {"status": "ambiguous", **base}

    selected = []
    selected_ids = set()
    for candidate in sorted(
        candidates,
        key=lambda item: (item["start"], -(item["end"] - item["start"]), item["entry"]["id"]),
    ):
        if candidate["entry"]["id"] in selected_ids:
            continue
        if any(
            candidate["start"] < existing["end"]
            and existing["start"] < candidate["end"]
            for existing in selected
        ):
            continue
        selected.append(candidate)
        selected_ids.add(candidate["entry"]["id"])

    if not selected:
        return {"status": "unsupported", **base}

    base["matches"] = [
        _public_match(candidate["entry"], candidate["term"])
        for candidate in selected
    ]
    return {"status": "supported", **base}


def is_icd_keyword_request(message, has_reviewed_keyword=False):
    normalized = normalize_keyword(message)
    has_graph_context = re.search(r"\b(icd|codes?|graph|embedding|umap)\b", normalized)
    if re.search(r"\b(highlight|jump|locate)\b", normalized):
        return bool(has_reviewed_keyword or has_graph_context)
    has_action = re.search(r"\b(show|view|open|find)\b", normalized)
    return bool(has_action and (has_reviewed_keyword or has_graph_context))
