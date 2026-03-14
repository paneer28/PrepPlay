#!/usr/bin/env python3

import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RTF_PATH = Path("/Users/paneer/Downloads/All Entrepreneurship PIs .rtf")
OUTPUT_PATH = ROOT / "data" / "performance-indicators.json"


SECTION_MAP = [
    ("Business Administration Core", "tier1"),
    ("Business Management and Administration Core", "bma_core"),
    ("Finance Core", "finance_core"),
    ("Marketing Core", "marketing_core"),
]

SECTION_EVENT_IDS = {
    "tier1": ["ent-series", "etdm-team"],
    "bma_core": ["ent-series", "etdm-team"],
    "finance_core": ["ent-series", "etdm-team"],
    "marketing_core": ["ent-series", "etdm-team"],
}

PI_PATTERN = re.compile(r"^(.*)\(([A-Z]{2,3}:\d{3})\)\s*\((PQ|CS|SP|SU|MN|ON)\)$")
AREA_PATTERN = re.compile(r"Instructional Area:\s*(.*?)\s*\(([A-Z]{2,3})\)$")


def load_rtf_text() -> str:
    return subprocess.check_output(
        ["textutil", "-convert", "txt", "-stdout", str(RTF_PATH)],
        text=True,
    )


def parse_indicators(text: str):
    lines = [line.strip() for line in text.splitlines()]

    area_names_by_prefix: dict[str, str] = {}
    for line in lines:
        match = AREA_PATTERN.match(line)
        if match:
            area_names_by_prefix[match.group(2)] = match.group(1).strip()

    current_section = None
    current_area = None
    in_indicator_block = False
    buffer: list[str] = []
    items: list[dict[str, str]] = []

    def flush_buffer(force: bool = False):
        nonlocal buffer
        if not buffer:
            return

        candidate = " ".join(buffer)
        match = PI_PATTERN.match(candidate)

        if match:
            code = match.group(2)
            prefix = code.split(":")[0]
            text_value = match.group(1).strip()

            if not text_value.endswith((".", "?", "!")):
                text_value += "."

            items.append(
                {
                    "section": current_section or "",
                    "instructionalArea": area_names_by_prefix.get(prefix, current_area or ""),
                    "code": code,
                    "text": text_value,
                    "level": match.group(3),
                }
            )
            buffer = []
            return

        if force:
            buffer = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        matched_section = False
        for marker, section_name in SECTION_MAP:
            if marker in line:
                flush_buffer(True)
                current_section = section_name
                in_indicator_block = False
                matched_section = True
                break
        if matched_section:
            continue

        area_match = AREA_PATTERN.match(line)
        if area_match:
            flush_buffer(True)
            current_area = area_match.group(1).strip()
            in_indicator_block = False
            continue

        if line.startswith("Performance Element:") or line.startswith("Standard:"):
            flush_buffer(True)
            in_indicator_block = False
            continue

        if line.startswith("Performance Indicators:"):
            flush_buffer(True)
            in_indicator_block = True
            continue

        if "Copyright" in line or line.startswith("Entrepreneurship (CS, SP, SU, MN, ON)"):
            flush_buffer(True)
            continue

        if not in_indicator_block:
            continue

        if re.search(r"\([A-Z]{2,3}:\d{3}\)\s*\((PQ|CS|SP|SU|MN|ON)\)$", line):
            buffer.append(line)
            flush_buffer()
        else:
            if buffer:
                buffer.append(line)
                flush_buffer()
            else:
                buffer = [line]
                flush_buffer()

    flush_buffer(True)
    return items


def merge_entrepreneurship_with_existing(parsed_items: list[dict[str, str]]):
    existing = json.loads(OUTPUT_PATH.read_text())
    non_entrepreneurship_items = [
        item for item in existing if item["clusterId"] != "entrepreneurship"
    ]

    merged_by_code: dict[str, dict] = {}
    sections_by_code: defaultdict[str, set[str]] = defaultdict(set)

    for item in parsed_items:
        code = item["code"]
        sections_by_code[code].add(item["section"])

        if code not in merged_by_code:
            merged_by_code[code] = item

    generated_items = []
    for code, item in sorted(merged_by_code.items(), key=lambda entry: entry[0]):
        event_ids = sorted(
            {
                event_id
                for section in sections_by_code[code]
                for event_id in SECTION_EVENT_IDS.get(section, [])
            }
        )

        generated_items.append(
            {
                "id": f"pi-entrepreneurship-{code.lower().replace(':', '-')}",
                "code": code,
                "text": item["text"],
                "clusterId": "entrepreneurship",
                "instructionalArea": item["instructionalArea"],
                "eventIds": event_ids,
                "sourceSection": sorted(sections_by_code[code]),
                "level": item["level"],
            }
        )

    combined = non_entrepreneurship_items + generated_items
    OUTPUT_PATH.write_text(json.dumps(combined, indent=2) + "\n")


def main():
    text = load_rtf_text()
    parsed_items = parse_indicators(text)
    merge_entrepreneurship_with_existing(parsed_items)


if __name__ == "__main__":
    main()
