#!/usr/bin/env python3

import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RTF_PATH = Path("/Users/paneer/Downloads/All Hospitality Indicators .rtf")
OUTPUT_PATH = ROOT / "data" / "performance-indicators.json"


SECTION_MAP = [
    ("Business Administration Core", "tier1"),
    ("Hospitality and Tourism Career Cluster", "tier2"),
    ("Event Management Pathway", "event_pathway"),
    ("Lodging Pathway", "lodging_pathway"),
    ("Restaurant Management Pathway", "restaurant_pathway"),
    ("Travel and Tourism Pathway", "travel_pathway"),
]

SECTION_EVENT_IDS = {
    "tier1": [
        "principles-hospitality",
        "htps-series",
        "htdm-team",
        "hlm-series",
        "qsrm-series",
        "rfsm-series",
        "ttdm-team",
    ],
    "tier2": [
        "htps-series",
        "htdm-team",
        "hlm-series",
        "qsrm-series",
        "rfsm-series",
        "ttdm-team",
    ],
    "lodging_pathway": ["hlm-series"],
    "restaurant_pathway": ["qsrm-series", "rfsm-series"],
    "travel_pathway": ["ttdm-team"],
}

PI_PATTERN = re.compile(r"^(.*)\(([A-Z]{2,3}:\d{3})\)\s*\((PQ|CS|SP)\)$")
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

        if "Copyright" in line or line.startswith("Hospitality and Tourism Cluster for"):
            flush_buffer(True)
            continue

        if not in_indicator_block:
            continue

        if re.search(r"\([A-Z]{2,3}:\d{3}\)\s*\((PQ|CS|SP)\)$", line):
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


def merge_hospitality_with_existing(parsed_items: list[dict[str, str]]):
    existing = json.loads(OUTPUT_PATH.read_text())
    non_hospitality_items = [item for item in existing if item["clusterId"] != "hospitality"]

    merged_by_code: dict[str, dict] = {}
    sections_by_code: defaultdict[str, set[str]] = defaultdict(set)

    for item in parsed_items:
        code = item["code"]
        sections_by_code[code].add(item["section"])

        if code not in merged_by_code:
            merged_by_code[code] = item

    generated_hospitality_items = []
    for code, item in sorted(merged_by_code.items(), key=lambda entry: entry[0]):
        event_ids = sorted(
            {
                event_id
                for section in sections_by_code[code]
                for event_id in SECTION_EVENT_IDS.get(section, [])
            }
        )

        generated_hospitality_items.append(
            {
                "id": f"pi-hospitality-{code.lower().replace(':', '-')}",
                "code": code,
                "text": item["text"],
                "clusterId": "hospitality",
                "instructionalArea": item["instructionalArea"],
                "eventIds": event_ids,
                "sourceSection": sorted(sections_by_code[code]),
                "level": item["level"],
            }
        )

    combined = non_hospitality_items + generated_hospitality_items
    OUTPUT_PATH.write_text(json.dumps(combined, indent=2) + "\n")


def main():
    text = load_rtf_text()
    parsed_items = parse_indicators(text)
    merge_hospitality_with_existing(parsed_items)


if __name__ == "__main__":
    main()
