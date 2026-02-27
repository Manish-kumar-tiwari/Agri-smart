from pathlib import Path
from threading import Lock
import warnings

import joblib
import pandas as pd

from ..config import get_settings
from ..schemas import PredictionInput
from .train_model import train_model

_settings = get_settings()
_model = None
_model_lock = Lock()
EXPECTED_COLUMNS = {
    "Area",
    "Item",
    "Year",
    "average_rain_fall_mm_per_year",
    "pesticides_tonnes",
    "avg_temp",
}


def load_model(model_path: str | None = None):
    global _model
    model_file = model_path or _settings.model_path

    if _model is not None:
        return _model

    with _model_lock:
        if _model is None:
            path = Path(model_file)
            if not path.exists():
                # Auto-recover in local deployments: train if model artifact is missing.
                train_model(model_path=path)
            _model = joblib.load(path)
            feature_names = set(getattr(_model, "feature_names_in_", []))
            if feature_names and feature_names != EXPECTED_COLUMNS:
                # Auto-recover when an old schema model exists.
                train_model(model_path=path)
                _model = joblib.load(path)

    return _model


def is_model_loaded() -> bool:
    return _model is not None


def predict_yield(payload: PredictionInput) -> float:
    model = load_model()
    row = pd.DataFrame(
        [
            {
                "Area": payload.area,
                "Item": payload.item,
                "Year": payload.year,
                "average_rain_fall_mm_per_year": payload.average_rain_fall_mm_per_year,
                "pesticides_tonnes": payload.pesticides_tonnes,
                "avg_temp": payload.avg_temp,
            }
        ]
    )
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="Found unknown categories in columns .* will be encoded as all zeros",
            category=UserWarning,
        )
        prediction = model.predict(row)[0]
    return float(prediction)
