#!/usr/bin/env python3
"""Build the ICD-10 reference table used by the ICD embedding hierarchy panel.

`viz/data/icd_code_embeddings.csv` carries only `code` and `chapter`, so the
scatter plot cannot show a human-readable description or an ICD hierarchy. This
script joins that code list against two public code tables and writes
`viz/data/icd_code_reference.csv`.

Sources
-------
CMS ICD-10-CM FY2026 "Code Descriptions in Tabular Order"
    https://www.cms.gov/files/zip/2026-code-descriptions-tabular-order.zip
    Fixed-width `icd10cm_order_2026.txt`; covers the ICD-10-CM specific codes
    (A3790, A4189, ...) that the embedding contains.

UK Biobank Data-Coding 19 (WHO ICD-10)
    https://biobank.ndph.ox.ac.uk/ukb/codown.cgi (POST id=19)
    Tab-separated `coding/meaning/node_id/parent_id/selectable`; covers the WHO
    codes that ICD-10-CM deleted or re-mapped (A090, A16x, B20x, A97, ...) and
    supplies the block grouping (`Block A65-A69`) used for the panel breadcrumb.

Together the two tables describe every code in the embedding. WHO wording wins
where both tables define a code, because the embedding is derived from UK
Biobank EHR records.

Output columns
--------------
code         Undotted code as it appears in the embedding (A692), or a block
             range (A65-A69).
label        Display form (A69.2, A65-A69).
description  Code title.
parent       Parent `code` value; empty for blocks.
kind         block | category | subcategory | extension
in_plot      1 when the code is an embedding point, 0 for structural ancestors.

Usage
-----
    python scripts/build_icd_reference.py            # downloads both sources
    python scripts/build_icd_reference.py --cms PATH --ukb PATH
"""

import argparse
import csv
import io
import sys
import urllib.request
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EMBEDDINGS_PATH = ROOT / "viz" / "data" / "icd_code_embeddings.csv"
OUTPUT_PATH = ROOT / "viz" / "data" / "icd_code_reference.csv"

CMS_ZIP_URL = "https://www.cms.gov/files/zip/2026-code-descriptions-tabular-order.zip"
CMS_MEMBER = "icd10cm_order_2026.txt"
UKB_URL = "https://biobank.ndph.ox.ac.uk/ukb/codown.cgi"
UKB_CODING_ID = "19"
USER_AGENT = "Mozilla/5.0 (compatible; aligatehr-report-web/1.0)"

KIND_BY_LENGTH = {3: "category", 4: "subcategory"}


def fetch(url, data=None):
    request = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def read_cms_order(path=None):
    """Return {undotted code: description} from the CMS fixed-width order file."""
    if path:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    else:
        archive = zipfile.ZipFile(io.BytesIO(fetch(CMS_ZIP_URL)))
        text = archive.read(CMS_MEMBER).decode("utf-8", errors="replace")

    descriptions = {}
    for line in text.splitlines():
        if not line.strip():
            continue
        code = line[6:13].strip()
        description = line[77:].strip()
        if code and description:
            descriptions[code] = description
    return descriptions


def read_ukb_coding(path=None):
    """Return (code descriptions, block descriptions, category to block map)."""
    if path:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    else:
        text = fetch(UKB_URL, data=f"id={UKB_CODING_ID}".encode()).decode(
            "utf-8", errors="replace"
        )

    rows = list(csv.DictReader(io.StringIO(text), delimiter="\t"))
    descriptions = {}
    blocks = {}
    node_codes = {}

    for row in rows:
        coding = row["coding"].strip()
        # `meaning` repeats the dotted code, e.g. "A69.2 Lyme disease".
        meaning = row["meaning"].split(" ", 1)[1] if " " in row["meaning"] else row["meaning"]
        node_codes[row["node_id"]] = coding
        if coding.startswith("Block "):
            blocks[coding[len("Block "):]] = meaning
        elif not coding.startswith("Chapter"):
            descriptions[coding] = meaning

    block_of_category = {}
    for row in rows:
        coding = row["coding"].strip()
        if len(coding) != 3 or coding.startswith("Block") or coding.startswith("Chapter"):
            continue
        parent = node_codes.get(row["parent_id"], "")
        if parent.startswith("Block "):
            block_of_category[coding] = parent[len("Block "):]

    return descriptions, blocks, block_of_category


def dotted_label(code):
    return code if len(code) <= 3 else f"{code[:3]}.{code[3:]}"


def code_kind(code):
    return KIND_BY_LENGTH.get(len(code), "extension")


def expand_nodes(plot_codes):
    """Return every plotted code plus the 3- and 4-character ancestors it needs."""
    nodes = set(plot_codes)
    for code in plot_codes:
        for length in (3, 4):
            if len(code) > length:
                nodes.add(code[:length])
    return nodes


def build_rows(plot_codes, cms, ukb, blocks, block_of_category):
    nodes = expand_nodes(plot_codes)
    missing = sorted(code for code in nodes if code not in ukb and code not in cms)
    if missing:
        raise SystemExit(
            f"{len(missing)} codes have no description in either source, "
            f"starting with {missing[:10]}"
        )

    used_blocks = {}
    rows = []
    for code in sorted(nodes):
        kind = code_kind(code)
        if kind == "category":
            parent = block_of_category.get(code, "")
            if parent:
                used_blocks[parent] = blocks[parent]
        elif kind == "subcategory":
            parent = code[:3]
        else:
            parent = code[:4] if code[:4] in nodes else code[:3]
        rows.append(
            {
                "code": code,
                "label": dotted_label(code),
                "description": ukb.get(code) or cms[code],
                "parent": parent,
                "kind": kind,
                "in_plot": "1" if code in plot_codes else "0",
            }
        )

    block_rows = [
        {
            "code": block,
            "label": block,
            "description": description,
            "parent": "",
            "kind": "block",
            "in_plot": "0",
        }
        for block, description in sorted(used_blocks.items())
    ]
    return block_rows + rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cms", help="local icd10cm_order_2026.txt instead of downloading")
    parser.add_argument("--ukb", help="local UK Biobank coding 19 TSV instead of downloading")
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    arguments = parser.parse_args()

    with EMBEDDINGS_PATH.open(encoding="utf-8") as handle:
        plot_codes = {row["code"].strip() for row in csv.DictReader(handle)}
    plot_codes.discard("")

    cms = read_cms_order(arguments.cms)
    ukb, blocks, block_of_category = read_ukb_coding(arguments.ukb)
    rows = build_rows(plot_codes, cms, ukb, blocks, block_of_category)

    output = Path(arguments.output)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=["code", "label", "description", "parent", "kind", "in_plot"]
        )
        writer.writeheader()
        writer.writerows(rows)

    plotted = sum(1 for row in rows if row["in_plot"] == "1")
    print(
        f"Wrote {output.relative_to(ROOT)}: {len(rows)} rows "
        f"({plotted} plotted codes, {len(rows) - plotted} structural nodes)"
    )
    if plotted != len(plot_codes):
        print(
            f"Warning: {len(plot_codes) - plotted} embedding codes are not in the output",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
