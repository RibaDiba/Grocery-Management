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

    def __init__(self, user_id: str):
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required")

        if genai is None:
            raise ImportError(
                "google-generativeai is not installed."
            )

        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model: genai.GenerativeModel = genai.GenerativeModel(config.LLM_MODEL)
        self.max_tokens: int = int(config.LLM_MAX_TOKENS)
        self.temperature: float = float(config.LLM_TEMPERATURE)
        self.user_id = user_id

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
        return f"""SYSTEM_ROLE:
            You are an expert receipt parser and food data normalizer. Your role is to extract all food items from a store receipt and estimate their typical freshness duration *only* if they are perishable.

        USER_ID: {self.user_id}

        TASK: Analyze the provided receipt text. Identify the purchase date to use as a reference. Then, extract all food items. For each item, normalize its name to the simplest, most general form.

        If the item is perishable (i.e., any consumable product that spoils or loses freshness within 100 days of purchase), provide an estimated shelf life in days.

        If the item is shelf-stable (lasts longer than 100 days), do NOT provide a shelf life.

        OUTPUT_FORMAT: You MUST return only a valid JSON array of objects. Each object must contain the following:

        REQUIRED_KEY:
        name: (string) The simplified, generic name of the food item (e.g., "Milk", "Cheese", "Apple", "Canned Chicken", "Peanut Butter").

        CONDITIONAL_KEYS (Perishable items ONLY):
        If, and only if, the item is perishable (spoils within 100 days), you MUST also include:

        min_days: (int) The minimum number of days in the estimated freshness range (e.g., if the range is 3-5 days, this value is 3).

        max_days: (int) The maximum number of days in the estimated freshness range (e.g., if the range is 3-5 days, this value is 5).

        Important: If the freshness duration for a perishable item is a single number (e.g., "7 days"), set both min_days and max_days to that number (e.g., "min_days": 7, "max_days": 7).
        
        Example Output:
        [
          {"name": "Milk", "min_days": 5, "max_days": 7},
          {"name": "Apple", "min_days": 14, "max_days": 21},
          {"name": "Canned Chicken"},
          {"name": "Peanut Butter"}
        ]

        IMPORTANT_RULES:

        Find Purchase Date: Silently identify the purchase date from the receipt (e.g., "11/06/24"). This date is your "day zero" for all estimations. Do NOT include this date in the output.

        Include All Food Items: Include all food or beverage products, including:
        
        Fresh, refrigerated, or frozen foods (meat, produce, dairy, bread).
        
        Shelf-stable items (canned goods, dry pasta, condiments, peanut butter, coffee, sealed jars).

        Exclude Non-Food Items:
        
        Exclude all household or non-food items (e.g., paper towels, soap, detergent).

        Normalize Item Names (Critical):

        Simplify each item name to its most generic, singular noun form.

        Remove brand names, sizes, and flavor descriptors.

        Retain adjectives only if they change expiration behavior. For example:

        Keep “Frozen,” “Cooked,” “Raw,” “Smoked,” “Fresh,” “Deli,” “Prepared,” or “Baked.”

        Remove non-essential adjectives such as “Organic,” “Whole,” “Low-fat,” “Italian,” or “Sweet.”

        Examples:
        
        “Organic Gala Apples” → “Apple”
        
        “Whole Milk” → “Milk”
        
        “Shredded Mozzarella Cheese” → “Cheese”
        
        “Frozen Chicken Strips” → “Frozen Chicken”
        
        “Fresh Atlantic Salmon” → “Fresh Salmon”
        
        “Greek Yogurt” → “Yogurt”

        Handle Abbreviations (Essential):

        Infer full item names from abbreviated forms to determine perishability.

        Example (Perishable): GV PARM → {"name": "Cheese", "min_days": 14, "max_days": 21}
        
        Example (Perishable): FRZ CHIC STRPS → {"name": "Frozen Chicken", "min_days": 90, "max_days": 100}
        
        Example (Shelf-Stable): GV CHNK CHKN → {"name": "Canned Chicken"}
        
        Example (Shelf-Stable): GV PNT BUTTR → {"name": "Peanut Butter"}

        Handle Multiples: If a food item appears more than once, output a separate object for each instance.

        Empty Result: If no valid food items are found, return an empty array [].

        No Extra Text: Output only the JSON array—no commentary, explanation, or metadata.

        RECEIPT_TEXT: {ocr_text}

        JSON_OUTPUT:

        """

    def add_groceries_to_db(self, items: list[dict[str, Any]]) -> list[str]:
        from datetime import datetime, timezone
        from bson import ObjectId
        from database import get_groceries_collection
        col = get_groceries_collection()
        user_oid = ObjectId(self.user_id)
        docs = []
        now = datetime.now(timezone.utc)
        for i in items:
            if not (isinstance(i, dict) and "name" in i):
                continue

            # Always store the name. If both min_days and max_days are present
            # and valid integers, store them. Otherwise treat the item as
            # non-perishable and do not add perish fields to the document.
            name = str(i.get("name"))
            doc = {
                "user_id": user_oid,
                "name": name,
                "created_at": now,
            }

            min_raw = i.get("min_days")
            max_raw = i.get("max_days")
            if min_raw is not None and max_raw is not None:
                try:
                    doc["min_days"] = int(min_raw)
                    doc["max_days"] = int(max_raw)
                except (TypeError, ValueError):
                    # If conversion fails, treat as non-perishable (omit fields)
                    pass

            docs.append(doc)
        if not docs:
            return []
        
        result = col.insert_many(docs)
        return [str(id) for id in result.inserted_ids]

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
                if isinstance(item, dict) and "name" in item and "min_days" in item and "max_days" in item:
                    try:
                        validated_items.append({
                            "name": str(item["name"]),
                            "min_days": int(item["min_days"]),
                            "max_days": int(item["max_days"]),
                        })
                    except (ValueError, TypeError):
                        continue

            return validated_items

        except json.JSONDecodeError:
            return []