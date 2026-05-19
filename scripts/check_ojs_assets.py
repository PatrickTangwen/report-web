#!/usr/bin/env python3

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VIZ_DIR = ROOT / "viz"
ATTACHMENT_RE = re.compile(r'FileAttachment\("([^"]+)"\)')


def git_tracked_paths():
    result = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return {Path(line.strip()) for line in result.stdout.splitlines() if line.strip()}


def main():
    tracked = git_tracked_paths()
    failures = []

    for qmd_path in sorted(VIZ_DIR.glob("*.qmd")):
        text = qmd_path.read_text(encoding="utf-8")
        attachments = sorted(set(ATTACHMENT_RE.findall(text)))

        for attachment in attachments:
            resolved = (qmd_path.parent / attachment).resolve()
            try:
                rel_path = resolved.relative_to(ROOT)
            except ValueError:
                failures.append(f"{qmd_path.relative_to(ROOT)} -> {attachment}: resolves outside repo")
                continue

            if not resolved.exists():
                failures.append(f"{qmd_path.relative_to(ROOT)} -> {rel_path}: missing file")
                continue

            if rel_path not in tracked:
                failures.append(f"{qmd_path.relative_to(ROOT)} -> {rel_path}: file exists but is not tracked by git")

    if failures:
        print("OJS asset check failed:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print("OJS asset check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
