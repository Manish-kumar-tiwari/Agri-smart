# AgriSmart - Detailed Project Overview

## 1. Project Summary
AgriSmart is a full-stack AI-powered crop yield prediction and farming advisory application.
It helps users:
- Predict crop yield from historical/agro-climatic features.
- Assess cultivation risk.
- Generate planting schedule recommendations.
- Evaluate food security impact.
- Receive AI-generated professional advisory text.
- Store and visualize prediction history.

The project has been aligned to the notebook model in:
- `backend/app/ml/Crop Yield Prediction Model .ipynb`

## 2. Problem Statement Alignment
The system is designed around:
- Optimizing planting schedules.
- Reducing food insecurity risk.

How this is implemented:
- Planting schedule logic (`planning_service.py`) returns sowing window, irrigation plan, and action steps.
- Food security logic (`food_security_service.py`) computes expected production and a `Secure/Watch/Critical` signal.
- Advisory layer (`llm_service.py`) produces professional, action-oriented recommendations.

## 3. Technology Stack

### Backend
- Python
- FastAPI
- scikit-learn
- pandas
- joblib
- SQLite3 (via Python `sqlite3` module)
- Uvicorn
- Optional Ollama (local Llama model inference)

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Recharts

## 4. High-Level Architecture
1. User submits feature inputs from React form.
2. Frontend calls `POST /predict`.
3. Backend validates input with Pydantic schema.
4. ML model predicts yield (`hg/ha`).
5. Backend converts output to `t/ha`.
6. Risk analysis, planting schedule, and food security assessments are computed.
7. LLM advisory is generated:
   - Uses Ollama if available.
   - Falls back to deterministic professional advisory if unavailable.
8. Prediction is stored in SQLite.
9. Frontend renders detailed result cards and history chart.

## 5. Repository Structure (Key Files)

### Backend Core
- `backend/app/main.py` - FastAPI app, routes, orchestration.
- `backend/app/config.py` - environment-based settings.
- `backend/app/logging_config.py` - logging setup.
- `backend/app/schemas.py` - request/response models.
- `backend/app/database.py` - SQLite initialization, insert, history retrieval.

### ML Layer
- `backend/app/ml/train_model.py` - notebook-aligned model training.
- `backend/app/ml/predict.py` - model loading and inference.
- `backend/app/ml/data/yield_df.csv` - training dataset.
- `backend/app/ml/model.joblib` - trained model artifact (generated).

### Services
- `backend/app/services/risk_service.py` - risk score + warning generation.
- `backend/app/services/planning_service.py` - planting schedule optimization output.
- `backend/app/services/food_security_service.py` - production adequacy and food security level.
- `backend/app/services/llm_service.py` - professional advisory generation and fallback.

### Frontend
- `frontend/src/App.jsx` - page layout and orchestration.
- `frontend/src/components/PredictionForm.jsx` - user input form.
- `frontend/src/components/ResultCard.jsx` - prediction + risk + advisory display.
- `frontend/src/components/HistoryChart.jsx` - historical trend graph.
- `frontend/src/services/api.js` - Axios API client.

## 6. ML Model Details
Model pipeline (aligned to notebook):
- Features:
  - `Area`
  - `Item`
  - `Year`
  - `average_rain_fall_mm_per_year`
  - `pesticides_tonnes`
  - `avg_temp`
- Target:
  - `hg/ha_yield`
- Preprocessing:
  - `StandardScaler` on numeric features.
  - `OneHotEncoder(drop='first', handle_unknown='ignore')` on categorical features.
- Regressor:
  - `DecisionTreeRegressor(random_state=0)`

Output handling:
- Raw model prediction: `predicted_yield_hg_ha`.
- Converted value: `predicted_yield_t_ha = predicted_yield_hg_ha / 10000`.

## 7. API Contract

### `GET /health`
Returns:
- `status` (`ok` or `degraded`)
- `model_loaded` (bool)
- `db_ready` (bool)

### `POST /predict`
Request body:
- `area` (str)
- `item` (str)
- `year` (int)
- `average_rain_fall_mm_per_year` (float)
- `pesticides_tonnes` (float)
- `avg_temp` (float)
- `farm_area_hectares` (float)

Response body:
- `predicted_yield_hg_ha`
- `predicted_yield_t_ha`
- `risk_level`
- `warnings`
- `expected_production_tons`
- `food_security_level`
- `food_security_notes`
- `planting_schedule`
  - `recommended_window`
  - `irrigation_plan`
  - `actions`
- `advisory`

### `GET /history?limit=20`
Returns recent predictions for charting and history view.

## 8. Risk, Planning, and Food Security Logic

### Risk (`risk_service.py`)
Heuristics based on:
- rainfall band,
- temperature extremes,
- very low pesticide usage.

Outputs:
- Risk level: `Low`, `Medium`, `High`.
- Agronomic warning list.

### Planting Schedule (`planning_service.py`)
Uses rainfall and temperature conditions to generate:
- recommended sowing window,
- irrigation strategy,
- tactical action items.

### Food Security (`food_security_service.py`)
Calculates:
- Expected production = `predicted_yield_t_ha * farm_area_hectares`.
- Crop baseline adequacy ratio.
- Food security level: `Secure`, `Watch`, `Critical`.
- Contingency notes.

## 9. LLM Advisory Layer
Advisory generation path:
- Provider: Ollama (local Llama model) if enabled and running.
- Fallback: deterministic professional advisory template.

Professional structure enforced in prompt:
1. Executive Summary
2. Key Risks
3. Recommended Actions (next 2-4 weeks)
4. Nutrient and Crop Strategy
5. Food Security and Contingency Plan

If Ollama is unavailable, system still returns usable advisory text (no request failure).

## 10. Database Design (SQLite)
SQLite DB path is configurable via environment.
Current table used for predictions:
- `predictions_v2`

Stored fields include:
- input fields,
- predicted yields (both units),
- risk data,
- food security data,
- planting schedule JSON,
- advisory text,
- timestamp.

## 11. Frontend UX
UI provides:
- Feature input form matching the notebook schema.
- Rich result card with:
  - notebook-unit yield (`hg/ha`),
  - converted yield (`t/ha`),
  - food security signal,
  - agronomic warnings,
  - schedule optimization,
  - AI advisory.
- History trend chart based on `predicted_yield_t_ha`.

## 12. Environment Variables (Backend)
Important variables:
- `SQLITE_DB_PATH`
- `MODEL_PATH`
- `LLM_PROVIDER` (`ollama` or `none`)
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_SECONDS`
- `CORS_ORIGINS`
- `LOG_LEVEL`
- `HIDE_DOCS`

## 13. Runbook

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.ml.train_model
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 14. Common Operational Notes
- If `/predict` returns model-related errors, retrain with:
  - `python -m app.ml.train_model`
- If Ollama is not running, advisory automatically falls back (no hard failure).
- Unknown category warnings from encoder are handled; unseen categories are encoded safely.
- History persistence is isolated in `predictions_v2` for schema stability.

## 15. Current Strengths
- End-to-end working ML + API + UI flow.
- Notebook-aligned model and feature contract.
- Professional advisory output structure.
- Risk + planning + food-security augmentation beyond raw regression.
- Resilient fallback behavior for LLM outages.

## 16. Suggested Next Enhancements
- Add authenticated users and per-farmer history partitioning.
- Add feature drift checks and periodic re-training pipeline.
- Add model versioning metadata in prediction records.
- Add district/state-specific baseline calibrations.
- Add exportable advisory reports (PDF).
