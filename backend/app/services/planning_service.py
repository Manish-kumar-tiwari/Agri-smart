from ..schemas import PredictionInput


def build_planting_schedule(payload: PredictionInput) -> dict[str, str | list[str]]:
    actions: list[str] = []

    if payload.average_rain_fall_mm_per_year >= 1000:
        window = "Plan sowing 2 to 3 weeks before your main rainy period."
        irrigation = "Use supplemental irrigation only during dry spells."
    elif payload.average_rain_fall_mm_per_year >= 700:
        window = "Use normal sowing calendar and stagger planting across 2 rounds."
        irrigation = "Schedule irrigation at critical growth stages."
    else:
        window = "Delay sowing until moisture is secured through rainfall or assured irrigation."
        irrigation = "Adopt pre-sowing irrigation and mulching to conserve water."

    if payload.avg_temp > 34:
        actions.append("Choose heat-tolerant varieties and avoid late sowing.")
    if payload.avg_temp < 14:
        actions.append("Advance seedbed preparation and use early-vigor varieties.")
    if payload.pesticides_tonnes < 2:
        actions.append("Increase field scouting frequency and integrated pest management steps.")

    actions.append("Review weather forecast weekly and adjust irrigation/fertilizer timing.")

    return {
        "recommended_window": window,
        "irrigation_plan": irrigation,
        "actions": actions,
    }
