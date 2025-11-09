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
    """Parses receipt OCR text via the configured LLM and inserts groceries.

    The parser expects the LLM to return a JSON array of objects. Each object
    must contain at least a `name` key. Perishable items include `min_days`
    and `max_days` (integers). Non-perishable items will be represented by
    objects that only include `name`.
    """

    def __init__(self, user_id: str):
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required")

        if genai is None:
            raise ImportError("google-generativeai is not installed.")

        genai.configure(api_key=config.GEMINI_API_KEY)
        # Broad typing to avoid issues when genai is mocked/unavailable at analysis time
        self.model = genai.GenerativeModel(config.LLM_MODEL)
        self.max_tokens = int(config.LLM_MAX_TOKENS)
        self.temperature = float(config.LLM_TEMPERATURE)
        self.user_id = user_id

    def parse_receipt_text(self, ocr_text: str) -> list[dict[str, Any]]:
        """Return a list of item dicts parsed from the receipt text.

        If the model call fails or the model returns invalid JSON, return an
        empty list (caller will handle uploading if desired).
        """
        if not ocr_text or not ocr_text.strip():
            return []

        prompt = self._build_prompt(ocr_text)

        try:
            response_text = self._call_model(prompt)
        except Exception:
            # Modeling service failed; treat as no items found.
            return []

        try:
            items = self._parse_response(response_text)
            return items
        except Exception:
            return []

    def _call_model(self, prompt: str) -> str:
        generation_config = genai.types.GenerationConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
        )
        resp = self.model.generate_content(
            prompt,
            generation_config=generation_config,
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
        """Construct the LLM prompt; include USER_ID and the receipt text.

        Build the string safely (no f-string with braces) so literal JSON
        examples in the prompt don't interfere with Python formatting.
        """
        parts = [
            "SYSTEM_ROLE:\n",
            "You are an expert receipt parser and food data normalizer. Your role is to extract all food items from a store receipt and estimate their typical freshness duration *only* if they are perishable.\n\n",
            "USER_ID: ", str(self.user_id), "\n\n",
            "TASK: Analyze the provided receipt text. Identify the purchase date to use as a reference. Then, extract all food items. For each item, normalize its name to the simplest, most general form.\n\n",
            "If the item is perishable (i.e., any consumable product that spoils or loses freshness within 100 days of purchase), provide an estimated shelf life in days.\n\n",
            "If the item is shelf-stable (lasts longer than 100 days), do NOT provide a shelf life.\n\n",
            "OUTPUT_FORMAT: You MUST return only a valid JSON array of objects. Each object must contain the following:\n\n",
            "REQUIRED_KEY:\n",
            "name: (string) The simplified, generic name of the food item (e.g., \"Milk\", \"Cheese\", \"Apple\", \"Canned Chicken\", \"Peanut Butter\").\n\n",
            "CONDITIONAL_KEYS (Perishable items ONLY):\n",
            "If, and only if, the item is perishable (spoils within 100 days), you MUST also include:\n\n",
            "min_days: (int) The minimum number of days in the estimated freshness range.\n\n",
            "max_days: (int) The maximum number of days in the estimated freshness range.\n\n",
            "Important: If the freshness duration for a perishable item is a single number (e.g., \"7 days\"), set both min_days and max_days to that number.\n\n",
            "Example Output:\n",
            "[\n",
            "  {\"name\": \"Milk\", \"min_days\": 5, \"max_days\": 7},\n",
            "  {\"name\": \"Apple\", \"min_days\": 14, \"max_days\": 21},\n",
            "  {\"name\": \"Canned Chicken\"},\n",
            "  {\"name\": \"Peanut Butter\"}\n",
            "]\n\n",
            "IMPORTANT_RULES:\n\n",
            "Find Purchase Date: Silently identify the purchase date from the receipt (e.g., \"11/06/24\"). This date is your \"day zero\" for all estimations. Do NOT include this date in the output.\n\n",
            "Include All Food Items: Include all food or beverage products, including fresh, refrigerated, or frozen foods and shelf-stable items.\n\n",
            "Exclude Non-Food Items: Exclude all household or non-food items (e.g., paper towels, soap, detergent).\n\n",
            "Normalize Item Names (Critical): Simplify each item name to its most generic, singular noun form.\n\n",
            "Handle Abbreviations (Essential): Infer full item names from abbreviated forms to determine perishability.\n\n",
            "Handle Multiples: If a food item appears more than once, output a separate object for each instance.\n\n",
            "Empty Result: If no valid food items are found, return an empty array [].\n\n",
            "No Extra Text: Output only the JSON array—no commentary, explanation, or metadata.\n\n",
            "RECEIPT_TEXT: ", ocr_text, "\n\n",
            "JSON_OUTPUT:\n\n",
        ]

        return "".join(parts)

    def add_groceries_to_db(self, items: list[dict[str, Any]]) -> list[str]:
        """Insert parsed items into the groceries collection.

        Rules:
        - Always store `name` and `created_at`.
        - Store `min_days` and `max_days` only when both are present and valid ints.
        - Return list of inserted ids as strings, or empty list if nothing inserted.
        """
        from datetime import datetime, timezone
        from bson import ObjectId
        from database import get_groceries_collection

        col = get_groceries_collection()
        user_oid = ObjectId(self.user_id)
        now = datetime.now(timezone.utc)
        from pymongo import ReturnDocument

        inserted_ids: list[str] = []

        for i in items:
            if not (isinstance(i, dict) and "name" in i):
                continue

            name = str(i.get("name"))
            # Determine increment amount; default to 1 if not provided/invalid
            try:
                inc_by = int(i.get("count", 1))
                if inc_by <= 0:
                    inc_by = 1
            except (TypeError, ValueError):
                inc_by = 1

            set_on_insert: dict[str, Any] = {
                "user_id": user_oid,
                "name": name,
                "created_at": now,
            }

            min_raw = i.get("min_days")
            max_raw = i.get("max_days")
            if min_raw is not None and max_raw is not None:
                try:
                    set_on_insert["min_days"] = int(min_raw)
                    set_on_insert["max_days"] = int(max_raw)
                except (TypeError, ValueError):
                    pass

            # Atomically increment count and create doc if missing; return the doc after update
            try:
                updated = col.find_one_and_update(
                    {"user_id": user_oid, "name": name},
                    {"$inc": {"count": inc_by}, "$setOnInsert": set_on_insert},
                    upsert=True,
                    return_document=ReturnDocument.AFTER,
                )
            except Exception as e:
                print(f"Error updating/inserting grocery item '{name}': {e}")
                updated = None

            if updated and updated.get("_id"):
                inserted_ids.append(str(updated.get("_id")))

        return inserted_ids

    def _parse_response(self, response_text: str) -> list[dict[str, Any]]:
        """Extract and validate JSON array from model output.

        Accepts items that only include `name` (non-perishable). If both
        `min_days` and `max_days` are present and valid ints, include them.
        """
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
                if not (isinstance(item, dict) and "name" in item):
                    continue

                name = str(item["name"])
                min_raw = item.get("min_days")
                max_raw = item.get("max_days")

                if min_raw is not None and max_raw is not None:
                    try:
                        min_i = int(min_raw)
                        max_i = int(max_raw)
                        validated_items.append({
                            "name": name,
                            "min_days": min_i,
                            "max_days": max_i,
                        })
                        continue
                    except (ValueError, TypeError):
                        pass

                # Non-perishable or missing perish info
                validated_items.append({"name": name})

            return validated_items

        except json.JSONDecodeError:
            return []
