from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor

FEATURES = [
    "Area",
    "Item",
    "Year",
    "average_rain_fall_mm_per_year",
    "pesticides_tonnes",
    "avg_temp",
]
TARGET = "hg/ha_yield"
BASE_DIR = Path(__file__).resolve().parent


def _load_training_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])
    return df


def train_model(data_path: str | Path | None = None, model_path: str | Path | None = None) -> dict:
    csv_path = Path(data_path) if data_path else BASE_DIR / "data" / "yield_df.csv"
    out_model_path = Path(model_path) if model_path else BASE_DIR / "model.joblib"

    df = _load_training_data(csv_path)
    x = df[FEATURES]
    y = df[TARGET]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=0, shuffle=True
    )

    numeric_features = ["Year", "average_rain_fall_mm_per_year", "pesticides_tonnes", "avg_temp"]
    categorical_features = ["Area", "Item"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("scale", StandardScaler(), numeric_features),
            ("ohe", OneHotEncoder(drop="first", handle_unknown="ignore"), categorical_features),
        ],
        remainder="drop",
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", DecisionTreeRegressor(random_state=0)),
        ]
    )

    pipeline.fit(x_train, y_train)
    preds = pipeline.predict(x_test)

    metrics = {
        "mae": float(mean_absolute_error(y_test, preds)),
        "rmse": float(mean_squared_error(y_test, preds) ** 0.5),
        "r2": float(r2_score(y_test, preds)),
    }

    out_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, out_model_path)
    return metrics


if __name__ == "__main__":
    training_metrics = train_model()
    print("Model trained successfully")
    print(training_metrics)
