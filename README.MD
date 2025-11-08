# Grocery Management Backend

FastAPI backend service for receipt OCR and parsing using Tesseract and Google Gemini AI.

## Prerequisites

- Docker and Docker Compose
- `.env` file with required environment variables

## Environment Variables

Create a `.env` file in the `apps/backend` directory with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash
LLM_MAX_TOKENS=1000
LLM_TEMPERATURE=0.7
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf
OCR_PREPROCESS_METHOD=thresh
```

## Running with Docker

### Build and Start the Service

```bash
cd apps/backend
docker-compose up --build
```

The API will be available at `http://localhost:8000`

### Stop the Service

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

## Running Locally (without Docker)

### Prerequisites

- Python 3.11+
- Tesseract OCR installed on your system
  - macOS: `brew install tesseract`
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
  - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

### Setup

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file (see Environment Variables section above)

4. Run the server:
```bash
python3 server.py
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check endpoint
- `POST /api/receipt/upload` - Upload receipt image for OCR and parsing
- `GET /docs` - Interactive API documentation (Swagger UI)

## Development

The Docker setup includes hot-reload, so any changes to the code will automatically restart the server.

## Troubleshooting

### Tesseract Not Found

If you get a "Tesseract not found" error when running locally, ensure Tesseract is installed and in your PATH.

### Permission Issues with Uploads

If you encounter permission issues with the uploads directory in Docker, ensure the directory has proper permissions:

```bash
chmod 777 uploads