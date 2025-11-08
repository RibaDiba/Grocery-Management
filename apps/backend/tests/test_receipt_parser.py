
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
            self.parser = ReceiptParser(user_id="507f1f77bcf86cd799439011")

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
        with patch.object(self.parser, '_build_prompt', wraps=self.parser._build_prompt) as spy_build_prompt:
            parsed_items = self.parser.parse_receipt_text(ocr_text)
            spy_build_prompt.assert_called_once_with(ocr_text)


        # Assertions
        self.assertEqual(len(parsed_items), 3)
        self.assertEqual(parsed_items[0]["name"], "Milk")
        self.assertEqual(parsed_items[1]["name"], "Apple")
        self.assertEqual(parsed_items[2]["name"], "Bread")
        self.assertIsInstance(parsed_items[0]["min_days"], int)
        self.assertIsInstance(parsed_items[0]["max_days"], int)
        self.assertIn("USER_ID: 507f1f77bcf86cd799439011", self.parser._build_prompt(ocr_text))


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

    def test_add_groceries_to_db(self):
        items = [
            {"name": "Milk", "min_days": 5, "max_days": 7},
            {"name": "Apple", "min_days": 10, "max_days": 14},
        ]

        with patch('database.get_groceries_collection') as mock_get_collection:
            mock_collection = MagicMock()
            mock_collection.insert_many.return_value.inserted_ids = ["id1", "id2"]
            mock_get_collection.return_value = mock_collection

            inserted_ids = self.parser.add_groceries_to_db(items)

            self.assertEqual(mock_collection.insert_many.call_count, 1)
            # Get the arguments passed to insert_many
            inserted_docs = mock_collection.insert_many.call_args[0][0]
            self.assertEqual(len(inserted_docs), 2)
            self.assertEqual(inserted_docs[0]["name"], "Milk")
            self.assertEqual(inserted_docs[1]["name"], "Apple")
            self.assertEqual(inserted_ids, ["id1", "id2"])


if __name__ == '__main__':
    unittest.main()
