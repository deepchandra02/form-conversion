# Form Conversion Web App

A local web application for converting forms using AI. This app consists of a Flask backend and React frontend.

## Quick Start

### Option 1: Use the automated startup script
```bash
./start.sh
```

This script will:
- Start the Flask backend on an available port (default: 5001)
- Auto-configure the frontend proxy
- Start the React frontend
- Open both services for you

### Option 2: Manual startup

1. **Start the Backend (Flask)**
   ```bash
   cd backend
   python app.py
   ```
   The Flask server will start on `http://localhost:5001`

2. **Start the Frontend (React)**
   ```bash
   cd ui
   npm run dev
   ```
   The React app will start on `http://localhost:3000` (or next available port)

## How it works

- **Frontend**: React app with Vite (port 3000+)
- **Backend**: Flask API server (port 5001+)
- **Proxy**: Vite proxies `/api/*` requests to the Flask backend
- **Communication**: Frontend uses relative URLs (`/api/config`, `/api/upload`, etc.)

## API Endpoints

- `GET /api/config` - Check configuration status
- `POST /api/config` - Save configuration
- `POST /api/upload` - Upload files for processing
- `POST /api/process/{session_id}` - Start processing
- `GET /api/progress/{session_id}` - Get processing progress
- `GET /api/results/{session_id}` - Get processing results
- `GET /api/download/{filename}` - Download processed files

## Configuration

Before processing files, you need to configure:
- T-Number
- API Endpoint
- API Key
- Model Name
- Version

Configuration is saved to `backend/secrets.json`

## File Processing

1. Upload PDF files through the web interface
2. Files are processed step-by-step with real-time progress
3. Download processed results when complete

## Local Development

The app is designed to run entirely locally:
- No external dependencies (except AI API)
- All processing happens on your machine
- Configuration stays on your machine

## Troubleshooting

**Port conflicts**: If ports 3000 or 5001 are in use, the servers will automatically find available ports.

**API connection issues**: Make sure both backend and frontend are running. The frontend proxy should automatically route API calls to the backend.

**Configuration not saving**: Check that the backend has write permissions in the `backend/` directory.