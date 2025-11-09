# Docker Setup Guide

This guide explains how to run the entire Grocery Management application using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Create environment file for backend:**
   ```bash
   cd apps/backend
   cp .env.example .env  # if .env.example exists
   # Or create .env file manually
   ```

2. **Configure environment variables:**
   Create `apps/backend/.env` with the following variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   LLM_MODEL=gemini-1.5-flash
   LLM_MAX_TOKENS=1000
   LLM_TEMPERATURE=0.7
   SECRET_KEY=your_secret_key_here_change_in_production
   MONGO_URI=mongodb://mongodb:27017/  # Will be overridden by docker-compose
   MONGO_DB_NAME=grocery_db
   MAX_FILE_SIZE_MB=10
   ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf
   OCR_PREPROCESS_METHOD=thresh
   ```

   **Note:** The `MONGO_URI` in `.env` will be overridden by Docker Compose to use the `mongodb` service name. This is correct for Docker setup.

3. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MongoDB: localhost:27017

## Services

The Docker Compose setup includes three services:

### 1. MongoDB (`mongodb`)
- Database service for storing user data, groceries, and receipts
- Port: 27017
- Data is persisted in a Docker volume: `mongodb_data`

### 2. Backend (`backend`)
- FastAPI backend service
- Port: 8000
- Connects to MongoDB using the service name `mongodb`
- Hot-reload enabled for development (code changes are reflected automatically)

### 3. Frontend (`frontend`)
- Next.js frontend application
- Port: 3000
- Connects to backend at `http://localhost:8000` (from browser perspective)

## Useful Commands

### Start services
```bash
docker-compose up
```

### Start in detached mode
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild services
```bash
docker-compose up --build
```

### Restart a specific service
```bash
docker-compose restart backend
```

## Development

The Docker setup is configured for development with hot-reload:

- **Backend**: Code changes are automatically reflected (volume mount)
- **Frontend**: For development, you may want to run `npm run dev` locally instead of using Docker, or modify the Dockerfile to use development mode

## Environment Variables

### Backend Environment Variables

Required variables in `apps/backend/.env`:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `SECRET_KEY`: Secret key for JWT token signing
- `MONGO_URI`: MongoDB connection string (overridden by Docker Compose)
- `MONGO_DB_NAME`: Database name (default: `grocery_db`)
- `LLM_MODEL`: Gemini model to use (e.g., `gemini-1.5-flash`)
- `LLM_MAX_TOKENS`: Maximum tokens for LLM responses
- `LLM_TEMPERATURE`: Temperature for LLM (0.0-1.0)

Optional variables:
- `MAX_FILE_SIZE_MB`: Maximum file upload size (default: 10)
- `ALLOWED_EXTENSIONS`: Comma-separated list of allowed file extensions
- `OCR_PREPROCESS_METHOD`: OCR preprocessing method (default: `thresh`)

## Troubleshooting

### MongoDB Connection Issues
If the backend can't connect to MongoDB:
1. Ensure MongoDB service is running: `docker-compose ps`
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify the `MONGO_URI` environment variable is set correctly in docker-compose.yml

### Port Already in Use
If you get port conflicts:
1. Stop other services using ports 3000, 8000, or 27017
2. Or modify the port mappings in `docker-compose.yml`

### Frontend Can't Connect to Backend
- Ensure backend is running and accessible at http://localhost:8000
- Check browser console for CORS errors
- Verify CORS settings in `apps/backend/server.py`

### Build Failures
- Ensure all Dockerfiles are correct
- Check that all required files exist (requirements.txt, package.json, etc.)
- Review build logs: `docker-compose build --no-cache`

## Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`. This means:
- Data persists even when containers are stopped
- To completely reset the database: `docker-compose down -v` (⚠️ deletes all data)

## Production Considerations

For production deployment:
1. Remove volume mounts for code (security)
2. Use environment variables instead of .env files
3. Set `NODE_ENV=production` properly
4. Use a reverse proxy (nginx) for frontend
5. Enable HTTPS
6. Use proper secrets management
7. Remove `--reload` flag from backend
8. Consider using Docker images from a registry instead of building locally

## Network

All services are on the `grocery-network` bridge network, allowing them to communicate using service names (e.g., `mongodb:27017`).

