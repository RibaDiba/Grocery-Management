from __future__ import annotations

import json
import re
from typing import Any
from config import config

try:
    import google.generativeai as genai  
except Exception:
    genai = None


class ReceiptParser:

    def __init__(self):
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required")

        if genai is None:
            raise ImportError(
                "google-generativeai is not installed."
            )

        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model: str = config.LLM_MODEL
        self.max_tokens: int = int(config.LLM_MAX_TOKENS)
        self.temperature: float = float(config.LLM_TEMPERATURE)

    def parse_receipt_text(self, ocr_text: str) -> list[dict[str, Any]]:
        if not ocr_text or not ocr_text.strip():
            return []

        prompt = self._build_prompt(ocr_text)

        try:
            response_text = self._call_model(prompt)
            items = self._parse_response(response_text)
            return items
        except Exception as e:
            raise Exception(f"Failed to parse receipt with Gemini: {str(e)}")

    def _call_model(self, prompt: str) -> str:
        resp = genai.generate(
            model=self.model,
            prompt=prompt,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
        )
        if isinstance(resp, str):
            return resp

        if hasattr(resp, "text") and resp.text:
            return resp.text

        if hasattr(resp, "content") and resp.content:
            return resp.content
        if hasattr(resp, "candidates") and getattr(resp, "candidates"):
            first = resp.candidates[0]
            if isinstance(first, dict):
                return first.get("content") or first.get("output") or json.dumps(first)
            if hasattr(first, "content"):
                return first.content
        return str(resp)

    def _build_prompt(self, ocr_text: str) -> str:
        return f"""SYSTEM_ROLE:
                You are an expert receipt parser. Your sole function is to extract perishable food items and estimate their freshness duration.

                TASK:
                Analyze the provided receipt text. Identify the purchase date to use as a reference. Then, extract all perishable food items and provide an estimated shelf life for each, relative to that purchase date.

                OUTPUT_FORMAT:
                You MUST return *only* a valid JSON array of objects.
                Each object must contain two keys:
                1.  `name`: (string) The name of the perishable item.
                2.  `expiration_range`: (string) A string representing the typical duration of freshness from the purchase date in days (e.g., "3-5", "7-10").

                IMPORTANT_RULES:
                1.  **Find Purchase Date:** First, silently identify the purchase date from the receipt. This date is your "day zero" for all estimations. Do NOT include this date in the output.
                2.  **Filter Perishables:** Scan all purchased items. You must *only* extract items that are clearly perishable (e.g., milk, fresh meat, produce, dairy, fresh bakery items).
                3.  **Ignore Non-Items:** Explicitly ignore all non-perishable goods (e.g., canned soup, dry pasta, paper towels, soap) and all receipt metadata (store name, address, subtotals, taxes, payment methods, etc.).
                4.  **Handle Duplicates:** If a perishable item is listed multiple times, it must appear as a separate object for each instance in the final JSON array.
                5.  **Empty Result:** If no perishable items are found, you must return an empty array `[]`.
                6.  **No Explanation:** Do NOT provide any text, commentary, or explanation before or after the JSON output.

                RECEIPT_TEXT:
                {ocr_text}

                JSON_OUTPUT:"""

    def _parse_response(self, response_text: str) -> list[dict[str, Any]]:
        json_match = re.search(r"\[.*\]", response_text, re.DOTALL)

        if not json_match:
            return []
        json_str = json_match.group(0)
        try:
            items = json.loads(json_str)
            if not isinstance(items, list):
                return []

            validated_items: list[dict[str, Any]] = []
            for item in items:
                if isinstance(item, dict) and "name" in item and "expiration_range" in item:
                    try:
                        validated_items.append({
                            "name": str(item["name"]),
                            "expiration_range": str(item["expiration_range"]),
                        })
                    except (ValueError, TypeError):
                        continue

            return validated_items

        except json.JSONDecodeError:
            return []