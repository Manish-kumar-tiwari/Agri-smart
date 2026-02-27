import wheatIcon from "../assets/wheat-icon.svg";

const riskStyle = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const foodStyle = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  Watch: "bg-amber-100 text-amber-700 border-amber-200",
  Secure: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

export default function ResultCard({ result }) {
  if (!result) {
    return null;
  }
  const schedule = result.planting_schedule || { recommended_window: "N/A", irrigation_plan: "N/A", actions: [] };
  const foodNotes = result.food_security_notes || [];

  return (
    <section className="card card-strong space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">Prediction Output</p>
          <div className="mt-1 flex items-center gap-2">
            <img src={wheatIcon} alt="Wheat icon" className="h-8 w-8 rounded-lg border border-earth-100 bg-white p-1" />
            <h2 className="heading-lg text-2xl">Yield Intelligence Report</h2>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskStyle[result.risk_level] || "border-slate-200 bg-slate-100 text-slate-700"}`}
        >
          {result.risk_level} Risk
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kpi-card">
          <p className="section-label">Yield (hg/ha)</p>
          <p className="metric-value mt-2 text-2xl">{result.predicted_yield_hg_ha.toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <p className="section-label">Yield (t/ha)</p>
          <p className="metric-value mt-2 text-2xl">{result.predicted_yield_t_ha.toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <p className="section-label">Expected Production</p>
          <p className="metric-value mt-2 text-2xl">{(result.expected_production_tons || 0).toFixed(2)} tons</p>
        </div>
        <div className="kpi-card">
          <p className="section-label">Food Security</p>
          <p className="heading-md mt-2 text-lg">{result.food_security_level}</p>
        </div>
      </div>

      <div className="rounded-xl border border-earth-100 bg-earth-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="heading-md text-sm uppercase tracking-wide">Food Security Signal</h3>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${foodStyle[result.food_security_level] || "border-slate-200 bg-slate-100 text-slate-700"}`}
          >
            {result.food_security_level}
          </span>
        </div>
        <ul className="body-copy list-disc space-y-1 pl-6 text-sm">
          {foodNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-earth-100 bg-white p-4">
          <h3 className="heading-md text-sm uppercase tracking-wide">Agronomic Warnings</h3>
          {result.warnings?.length ? (
            <ul className="body-copy mt-2 list-disc space-y-1 pl-6 text-sm">
              {result.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="body-copy mt-2 text-sm">No major warning detected.</p>
          )}
        </div>

        <div className="rounded-xl border border-earth-100 bg-white p-4">
          <h3 className="heading-md text-sm uppercase tracking-wide">Planting Schedule Plan</h3>
          <p className="body-copy mt-2 text-sm">{schedule.recommended_window}</p>
          <p className="body-copy mt-2 text-sm">
            <span className="heading-md">Irrigation:</span> {schedule.irrigation_plan}
          </p>
          <ul className="body-copy mt-2 list-disc space-y-1 pl-6 text-sm">
            {schedule.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-earth-100 bg-white p-4">
        <h3 className="heading-md text-sm uppercase tracking-wide">AI Advisory</h3>
        <p className="body-copy mt-2 whitespace-pre-line text-sm leading-6">{result.advisory}</p>
      </div>

      <div className="rounded-xl border border-earth-100 bg-earth-50 p-4">
        <h3 className="heading-md text-sm uppercase tracking-wide">Analyst Notes</h3>
        {result.warnings?.length ? (
          <p className="body-copy mt-2 text-sm">Risk is active. Prioritize mitigation actions listed in warnings and schedule plan.</p>
        ) : (
          <p className="body-copy mt-2 text-sm">Current prediction has stable risk profile. Continue monitoring weekly field conditions.</p>
        )}
      </div>
    </section>
  );
}
