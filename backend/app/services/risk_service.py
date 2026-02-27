from typing import Tuple

from ..schemas import PredictionInput


def analyze_risk(payload: PredictionInput) -> Tuple[str, list[str]]:
    warnings: list[str] = []
    risk_score = 0

    if payload.average_rain_fall_mm_per_year < 500:
        warnings.append("Rainfall is below recommended level; drought stress may reduce yield.")
        risk_score += 2
    elif payload.average_rain_fall_mm_per_year < 800:
        warnings.append("Rainfall is moderate; irrigation backup is advised.")
        risk_score += 1

    if payload.avg_temp > 35 or payload.avg_temp < 12:
        warnings.append("Average temperature is outside the optimal range for many crops.")
        risk_score += 1

    if payload.pesticides_tonnes < 2:
        warnings.append("Very low pesticide usage detected; strengthen pest scouting and IPM plan.")
        risk_score += 1

    if risk_score >= 3:
        return "High", warnings
    if risk_score >= 1:
        return "Medium", warnings
    return "Low", warnings
