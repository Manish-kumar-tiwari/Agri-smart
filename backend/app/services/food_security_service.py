from ..schemas import PredictionInput


def assess_food_security(
    payload: PredictionInput, predicted_yield_t_ha: float, risk_level: str
) -> tuple[str, float, list[str]]:
    expected_production_tons = predicted_yield_t_ha * payload.farm_area_hectares

    baseline_by_crop_t_ha = {
        "maize": 4.0,
        "rice": 4.5,
        "wheat": 3.8,
        "soybeans": 2.8,
        "potatoes": 20.0,
    }
    baseline = baseline_by_crop_t_ha.get(payload.item.lower(), 3.5)
    adequacy_ratio = predicted_yield_t_ha / baseline if baseline > 0 else 0

    notes: list[str] = []
    if risk_level == "High" or adequacy_ratio < 0.6:
        level = "Critical"
        notes.append("Projected output is vulnerable; local food supply risk is elevated.")
        notes.append("Prioritize water, pest, and crop-diversification contingency measures.")
    elif risk_level == "Medium" or adequacy_ratio < 0.85:
        level = "Watch"
        notes.append("Projected output needs close monitoring to avoid seasonal shortages.")
        notes.append("Apply timely interventions in irrigation, pest control, and planting window.")
    else:
        level = "Secure"
        notes.append("Projected output supports stable contribution to local food availability.")
        notes.append("Maintain current practices and continue preventive monitoring.")

    return level, float(expected_production_tons), notes
