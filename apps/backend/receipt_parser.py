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
        self.model: genai.GenerativeModel = genai.GenerativeModel(config.LLM_MODEL)
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
    You are an expert receipt parser and food data normalizer. Your role is to extract all expirable food items from a store receipt and estimate their typical freshness duration.

TASK: Analyze the provided receipt text. Identify the purchase date to use as a reference. Then, extract all items that are perishable or have an actual expiration or “best by” date (i.e., any consumable product that spoils or loses freshness within 100 days of purchase). For each item, normalize its name to the simplest, most general form—but retain adjectives only if they meaningfully affect freshness duration—and provide an estimated shelf life in days.

OUTPUT_FORMAT: You MUST return only a valid JSON array of objects. Each object must contain three keys:

name: (string) The simplified, generic name of the food item (e.g., "Milk", "Cheese", "Apple", "Chicken", "Frozen Chicken").

min_days: (int) The minimum number of days in the estimated freshness range (e.g., if the range is 3-5 days, this value is 3).

max_days: (int) The maximum number of days in the estimated freshness range (e.g., if the range is 3-5 days, this value is 5).

Important: If the freshness duration is a single number (e.g., "7 days"), set both min_days and max_days to that number (e.g., "min_days": 7, "max_days": 7).

IMPORTANT_RULES:

Find Purchase Date: Silently identify the purchase date from the receipt (e.g., "11/06/24"). This date is your "day zero" for all estimations. Do NOT include this date in the output.

Include All Expirable Items: Include all food or beverage products that can expire or spoil within 100 days, including:

Fresh, refrigerated, or frozen foods (meat, seafood, produce, dairy, eggs, bread, bakery goods).

Refrigerated packaged foods (e.g., yogurt, hummus, deli meat, salad dressing, tortillas).

Prepared or ready-to-eat foods.

Beverages that spoil (e.g., milk, juice, smoothies).

Frozen foods (e.g., frozen vegetables, frozen chicken).

Exclude Non-Expirable or Long-Lasting Items:

Exclude any product with a typical shelf life greater than 100 days (e.g., canned goods, dry pasta, condiments, peanut butter, coffee, shelf-stable snacks, sealed jars).

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

“Cooked Ham” → “Cooked Ham”

“Greek Yogurt” → “Yogota”

Handle Abbreviations (Essential):

Infer full item names from abbreviated forms to determine perishability.

Example (Include): GV PARM → “Cheese”

Example (Include): FRZ CHIC STRPS → “Frozen Chicken”

Example (Ignore): GV CHNK CHKN → “Canned Chicken” → shelf-stable → ignore

Example (Ignore): GV PNT BUTTR → “Peanut Butter” → shelf-stable → ignore

Handle Multiples: If a perishable item appears more than once, output a separate object for each instance.

Shelf Life Cutoff: Do NOT include any item whose typical freshness or expiration exceeds 100 days from the purchase date.

Empty Result: If no valid expirable items are found, return an empty array [].

No Extra Text: Output only the JSON array—no commentary, explanation, or metadata.

RECEIPT_TEXT: {ocr_text}

JSON_OUTPUT:

"""

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