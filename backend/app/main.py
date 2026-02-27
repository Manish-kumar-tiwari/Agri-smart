import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import db_is_ready, get_recent_predictions, init_db, save_prediction
from .logging_config import configure_logging
from .ml.predict import is_model_loaded, load_model, predict_yield
from .schemas import HealthResponse, HistoryItem, PredictionInput, PredictionResponse
from .services.food_security_service import assess_food_security
from .services.llm_service import generate_advisory
from .services.planning_service import build_planting_schedule
from .services.risk_service import analyze_risk

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


def _parsed_origins() -> list[str]:
    return [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]


def _build_prediction_context(payload: PredictionInput) -> dict:
    try:
        predicted_yield_hg_ha = predict_yield(payload)
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(status_code=500, detail="Prediction failed unexpectedly") from exc

    predicted_yield_t_ha = predicted_yield_hg_ha / 10000.0
    risk_level, warnings = analyze_risk(payload)
    planting_schedule = build_planting_schedule(payload)
    food_security_level, expected_production_tons, food_security_notes = assess_food_security(
        payload, predicted_yield_t_ha, risk_level
    )

    return {
        "predicted_yield_hg_ha": predicted_yield_hg_ha,
        "predicted_yield_t_ha": predicted_yield_t_ha,
        "risk_level": risk_level,
        "warnings": warnings,
        "expected_production_tons": expected_production_tons,
        "food_security_level": food_security_level,
        "food_security_notes": food_security_notes,
        "planting_schedule": planting_schedule,
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    try:
        load_model()
        logger.info("Model loaded successfully")
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        logger.error("Model loading failed; API will run in degraded mode: %s", exc)
    yield


app = FastAPI(
    title="AgriSmart API",
    version="1.2.0",
    docs_url=None if settings.hide_docs else "/docs",
    redoc_url=None if settings.hide_docs else "/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parsed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    status = "ok" if is_model_loaded() else "degraded"
    return HealthResponse(status=status, model_loaded=is_model_loaded(), db_ready=db_is_ready())


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionInput) -> PredictionResponse:
    context = _build_prediction_context(payload)
    advisory = generate_advisory(
        payload,
        context["predicted_yield_t_ha"],
        context["risk_level"],
        context["planting_schedule"],
        context["food_security_level"],
    )

    record = {
        **payload.model_dump(),
        **context,
        "advisory": advisory,
    }
    inserted_id = save_prediction(record)
    if inserted_id is None:
        logger.warning("Prediction was generated but could not be persisted to SQLite")

    return PredictionResponse(**context, advisory=advisory)


@app.get("/history", response_model=list[HistoryItem])
def history(limit: int = Query(default=20, ge=1, le=100)) -> list[HistoryItem]:
    return [HistoryItem(**item) for item in get_recent_predictions(limit=limit)]
