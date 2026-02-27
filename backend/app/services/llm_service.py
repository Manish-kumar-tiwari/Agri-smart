import logging
from functools import lru_cache
from typing import Any

import httpx

from ..config import get_settings
from ..ml.predict import predict_yield
from ..schemas import PredictionInput

logger = logging.getLogger(__name__)
settings = get_settings()
GRAIN_CANDIDATES = ("Maize", "Rice, paddy", "Sorghum", "Wheat", "Soybeans")

PROMPT_TEMPLATE = """You are an agricultural expert. Based on the following data:
Area: {area}
Crop: {crop}
Year: {year}
Predicted Yield: {yield_value}
Average Rainfall: {rainfall}
Pesticides (tonnes): {pesticides}
Average Temperature: {avg_temp}
Risk Level: {risk}
Recommended Planting Window: {planting_window}
Food Security Level: {food_security_level}

Write a professional advisory for farmers and field officers.
Use clear, practical language and avoid vague advice.
Keep the response concise but specific.
Use the following structure with section titles:
1) Executive Summary
2) Key Risks
3) Recommended Actions (next 2-4 weeks)
4) Nutrient and Crop Strategy
5) Food Security and Contingency Plan
Include at least 6 actionable bullet points total.
"""


def _rainfall_band(rainfall_mm: float) -> str:
    if rainfall_mm < 500:
        return "low rainfall"
    if rainfall_mm < 1000:
        return "moderate rainfall"
    return "high rainfall"


def _temperature_band(avg_temp_c: float) -> str:
    if avg_temp_c < 18:
        return "cool temperature"
    if avg_temp_c <= 30:
        return "moderate-to-warm temperature"
    return "high temperature"


def _build_grain_suggestions(payload: PredictionInput, predicted_yield_t_ha: float) -> str:
    rankings: list[tuple[str, float]] = []

    for grain in GRAIN_CANDIDATES:
        try:
            candidate_payload = payload.model_copy(update={"item": grain})
            predicted_hg_ha = predict_yield(candidate_payload)
            rankings.append((grain, float(predicted_hg_ha) / 10000.0))
        except Exception as exc:
            logger.debug("Unable to score candidate grain %s: %s", grain, exc)

    if not rankings:
        return ""

    rankings.sort(key=lambda value: value[1], reverse=True)
    top_grain, top_yield = rankings[0]
    current_grain = payload.item
    gain = top_yield - predicted_yield_t_ha
    pct_gain = (gain / predicted_yield_t_ha * 100.0) if predicted_yield_t_ha > 0 else 0.0

    top_rank_lines = [f"- {index}. {grain}: {yield_t_ha:.2f} t/ha" for index, (grain, yield_t_ha) in enumerate(rankings[:3], start=1)]

    recommendation = (
        f"- Best grain for current conditions is {top_grain} with estimated yield {top_yield:.2f} t/ha."
        if top_grain.lower() != current_grain.lower() and gain > 0
        else f"- Your selected grain {current_grain} is already near the top for the given condition ({predicted_yield_t_ha:.2f} t/ha)."
    )

    switch_line = (
        f"- Switching from {current_grain} to {top_grain} may add about {gain:.2f} t/ha ({pct_gain:.1f}% improvement)."
        if top_grain.lower() != current_grain.lower() and gain > 0
        else f"- Keep optimizing {current_grain} with the same condition profile to protect yield stability."
    )

    return (
        "Grain Suggestion (Point-wise):\n"
        f"- Entered grain: {current_grain}.\n"
        f"- Condition summary: {_rainfall_band(payload.average_rain_fall_mm_per_year)} ({payload.average_rain_fall_mm_per_year} mm/year), "
        f"{_temperature_band(payload.avg_temp)} ({payload.avg_temp} C), pesticides {payload.pesticides_tonnes} tonnes.\n"
        f"- Estimated yield for entered grain: {predicted_yield_t_ha:.2f} t/ha.\n"
        f"{recommendation}\n"
        f"{switch_line}\n"
        "- Top grain options for the same condition:\n"
        f"{'\n'.join(top_rank_lines)}"
    )


def _fallback_advice(
    payload: PredictionInput,
    predicted_yield_t_ha: float,
    risk_level: str,
    planting_schedule: dict[str, str | list[str]],
    food_security_level: str,
) -> str:
    actions = planting_schedule.get("actions", [])
    first_action = actions[0] if actions else "Review field conditions weekly and update operations accordingly."
    second_action = actions[1] if len(actions) > 1 else "Coordinate irrigation and nutrient timing with forecast rainfall."

    return (
        "Executive Summary:\n"
        f"- Predicted yield for {payload.item} in {payload.area} is {predicted_yield_t_ha:.2f} t/ha.\n"
        f"- Current production risk is {risk_level}; food security status is {food_security_level}.\n\n"
        "Key Risks:\n"
        f"- Rainfall profile ({payload.average_rain_fall_mm_per_year} mm/year) and temperature ({payload.avg_temp} C) may affect yield stability.\n"
        f"- Pesticide intensity ({payload.pesticides_tonnes} tonnes) should be aligned with integrated pest management.\n\n"
        "Recommended Actions (next 2-4 weeks):\n"
        f"- {planting_schedule.get('recommended_window', 'Follow local planting calendar and update by weekly forecast.')}\n"
        f"- {planting_schedule.get('irrigation_plan', 'Maintain stage-wise irrigation discipline.')}\n"
        f"- {first_action}\n"
        f"- {second_action}\n\n"
        "Nutrient and Crop Strategy:\n"
        "- Apply nutrient doses in split applications and verify with local soil-test guidance.\n"
        "- Keep a backup seed plan with a short-duration alternative crop for adverse weather scenarios.\n\n"
        "Food Security and Contingency Plan:\n"
        "- Track expected output against household or local demand and review every 2 weeks.\n"
        "- If risk rises, prioritize water access, pest surveillance, and diversified planting blocks."
    )


def _ollama_response(prompt: str) -> str:
    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    payload = {"model": settings.ollama_model, "prompt": prompt, "stream": False}
    with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        text = data.get("response", "").strip()
        if not text:
            raise ValueError("Empty response from Ollama")
        return text


def _llm_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                text = item
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""
            else:
                text = getattr(item, "text", None) or getattr(item, "content", None) or ""
            normalized = str(text).strip()
            if normalized:
                parts.append(normalized)
        return "\n".join(parts).strip()

    if isinstance(content, dict):
        text = content.get("text") or content.get("content") or ""
        return str(text).strip()

    return str(content).strip()


@lru_cache(maxsize=1)
def _groq_client():
    try:
        from langchain_groq import ChatGroq
    except Exception as exc:
        raise RuntimeError("langchain_groq is not installed") from exc

    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0,
    )


def _groq_response(prompt: str) -> str:
    client = _groq_client()
    response = client.invoke(prompt)
    text = _llm_content_to_text(getattr(response, "content", ""))
    if not text:
        raise ValueError("Empty response from Groq")
    return text


def _llm_response(prompt: str) -> str:
    if settings.llm_provider == "groq":
        return _groq_response(prompt)
    if settings.llm_provider == "ollama":
        return _ollama_response(prompt)
    raise ValueError(f"Unsupported llm_provider: {settings.llm_provider}")


def generate_advisory(
    payload: PredictionInput,
    predicted_yield_t_ha: float,
    risk_level: str,
    planting_schedule: dict[str, str | list[str]],
    food_security_level: str,
) -> str:
    grain_suggestions = _build_grain_suggestions(payload, predicted_yield_t_ha)
    prompt = PROMPT_TEMPLATE.format(
        area=payload.area,
        crop=payload.item,
        year=payload.year,
        yield_value=f"{predicted_yield_t_ha:.2f} tons/hectare",
        rainfall=payload.average_rain_fall_mm_per_year,
        pesticides=payload.pesticides_tonnes,
        avg_temp=payload.avg_temp,
        risk=risk_level,
        planting_window=planting_schedule.get("recommended_window", "N/A"),
        food_security_level=food_security_level,
    )

    try:
        advisory = _llm_response(prompt)
        return f"{advisory}\n\n{grain_suggestions}" if grain_suggestions else advisory
    except Exception as exc:
        logger.warning("LLM advisory unavailable; using fallback advice: %s", exc)

    fallback_advisory = _fallback_advice(
        payload, predicted_yield_t_ha, risk_level, planting_schedule, food_security_level
    )
    return f"{fallback_advisory}\n\n{grain_suggestions}" if grain_suggestions else fallback_advisory
