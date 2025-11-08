
import json
import unittest
from unittest.mock import MagicMock, patch

from receipt_parser import ReceiptParser


class TestReceiptParser(unittest.TestCase):

    def setUp(self):
        self.patcher = patch('receipt_parser.genai')
        self.mock_genai = self.patcher.start()

        # Mock the configure and GenerativeModel methods
        self.mock_genai.configure.return_value = None
        self.mock_model = MagicMock()
        self.mock_genai.GenerativeModel.return_value = self.mock_model

        # Set a dummy API key for the test
        with patch('receipt_parser.config') as mock_config:
            mock_config.GEMINI_API_KEY = "test_api_key"
            mock_config.LLM_MODEL = "gemini-pro"
            mock_config.LLM_MAX_TOKENS = "2048"
            mock_config.LLM_TEMPERATURE = "0.7"
            self.parser = ReceiptParser()

    def tearDown(self):
        self.patcher.stop()

    def test_parse_receipt_text_success(self):
        # Sample OCR text from a receipt
        ocr_text = """
        GROCERY STORE
        123 MAIN ST, ANYTOWN USA
        DATE: 2025-11-08

        Organic Milk      $3.50
        Apples (Gala)     $2.00
        Bread             $2.25
        Paper Towels      $5.00
        """

        # Expected output from the mocked LLM
        mock_llm_response = json.dumps([
            {"name": "Milk", "min_days": 5, "max_days": 7},
            {"name": "Apple", "min_days": 10, "max_days": 14},
            {"name": "Bread", "min_days": 5, "max_days": 7},
        ])

        # Configure the mock model to return the desired response
        self.mock_model.generate_content.return_value.text = mock_llm_response

        # Call the method to be tested
        parsed_items = self.parser.parse_receipt_text(ocr_text)

        # Assertions
        self.assertEqual(len(parsed_items), 3)
        self.assertEqual(parsed_items[0]["name"], "Milk")
        self.assertEqual(parsed_items[1]["name"], "Apple")
        self.assertEqual(parsed_items[2]["name"], "Bread")
        self.assertIsInstance(parsed_items[0]["min_days"], int)
        self.assertIsInstance(parsed_items[0]["max_days"], int)

    def test_parse_receipt_text_empty_input(self):
        parsed_items = self.parser.parse_receipt_text("")
        self.assertEqual(parsed_items, [])

    def test_parse_receipt_text_no_expirable_items(self):
        ocr_text = """
        GROCERY STORE
        DATE: 2025-11-08

        Paper Towels      $5.00
        Soap              $3.00
        """
        mock_llm_response = "[]"
        self.mock_model.generate_content.return_value.text = mock_llm_response

        parsed_items = self.parser.parse_receipt_text(ocr_text)
        self.assertEqual(parsed_items, [])

    def test_parse_receipt_text_invalid_json_response(self):
        ocr_text = "some receipt text"
        mock_llm_response = "this is not json"
        self.mock_model.generate_content.return_value.text = mock_llm_response

        parsed_items = self.parser.parse_receipt_text(ocr_text)
        self.assertEqual(parsed_items, [])

if __name__ == '__main__':
    unittest.main()
