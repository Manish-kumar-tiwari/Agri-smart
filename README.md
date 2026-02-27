# AgriSmart - AI Powered Crop Yield Prediction & Farming Assistant

Full-stack app with:
- FastAPI + scikit-learn ML regression (notebook-aligned `DecisionTreeRegressor`)
- Risk analysis module
- LLM advisory service layer (Llama via Ollama/fallback)
- SQLite3 prediction history
- Planting schedule optimization
- Food security signal with mitigation guidance
- React + Tailwind + Recharts frontend

## Project Structure

- `backend/` - API, ML training/prediction, SQLite integration
- `frontend/` - React UI for form input, result view, and history chart

## Backend Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.ml.train_model
uvicorn app.main:app --reload
```

API:
- `GET /health`
- `POST /predict`
- `GET /history?limit=20`

## Frontend Run

```bash


cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env` if backend is on a different host/port.
