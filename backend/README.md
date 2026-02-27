# AgriSmart Backend

## Production-Oriented Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.ml.train_model
```

## Free Open-Source LLM (Llama via Ollama)

Install Ollama, then pull and run a Llama model:

```bash
ollama pull llama3.1:8b
ollama run llama3.1:8b
```

Set these in `.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT_SECONDS=30
```

Run local dev server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run production server:

```bash
gunicorn -c gunicorn_conf.py app.main:app
```

Windows production-style run (Gunicorn is not supported on Windows):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

## Endpoints

- `GET /health`
- `POST /predict`
- `GET /history?limit=20`

`POST /predict` now returns:
- Yield prediction (`tons/hectare`)
- Risk level and warnings
- Planting schedule optimization fields
- Food security level and mitigation notes
- AI advisory summary

Request payload is aligned to the notebook model:
- `area`
- `item`
- `year`
- `average_rain_fall_mm_per_year`
- `pesticides_tonnes`
- `avg_temp`
- `farm_area_hectares`

## Important Env Vars

- `CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com`
- `HIDE_DOCS=true` to disable docs endpoints
- `LLM_PROVIDER=ollama|none`
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_MODEL=llama3.1:8b`
- `SQLITE_DB_PATH=app/data/agrismart.db`
