const riskStyle = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700"
};

const foodStyle = {
  Critical: "bg-red-100 text-red-700",
  Watch: "bg-amber-100 text-amber-700",
  Secure: "bg-emerald-100 text-emerald-700"
};

export default function ResultCard({ result }) {
  if (!result) {
    return null;
  }
  const schedule = result.planting_schedule || { recommended_window: "N/A", irrigation_plan: "N/A", actions: [] };
  const foodNotes = result.food_security_notes || [];

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Prediction Result</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyle[result.risk_level] || "bg-slate-100 text-slate-700"}`}>
          {result.risk_level} Risk
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-earth-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Predicted Yield (Notebook Unit)</p>
          <p className="mt-1 text-3xl font-black text-earth-700">{result.predicted_yield_hg_ha.toFixed(2)} hg/ha</p>
        </div>
        <div className="rounded-lg border border-earth-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Converted Yield</p>
          <p className="mt-1 text-3xl font-black text-earth-700">{result.predicted_yield_t_ha.toFixed(2)} t/ha</p>
        </div>
      </div>

      <p className="text-sm text-earth-700">Expected Production: {(result.expected_production_tons || 0).toFixed(2)} tons</p>

      <div className="rounded-lg border border-earth-100 bg-earth-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Food Security Signal (Insecurity Risk)</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${foodStyle[result.food_security_level] || "bg-slate-100 text-slate-700"}`}>
            {result.food_security_level}
          </span>
        </div>
        <ul className="list-disc space-y-1 pl-6 text-sm text-earth-700">
          {foodNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Agronomic Warnings</h3>
        {result.warnings?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-earth-700">
            {result.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-earth-700">No major warning detected.</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Planting Schedule Optimization Plan</h3>
        <p className="mt-1 text-sm text-earth-700">{schedule.recommended_window}</p>
        <p className="mt-1 text-sm text-earth-700">Irrigation: {schedule.irrigation_plan}</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-earth-700">
          {schedule.actions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">AI Advisory</h3>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-earth-700">{result.advisory}</p>
      </div>
    </section>
  );
}
