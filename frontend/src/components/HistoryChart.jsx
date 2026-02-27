import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

function toSafeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function rollingAverage(values, endIndex, windowSize = 3) {
  const startIndex = Math.max(0, endIndex - windowSize + 1);
  const segment = values.slice(startIndex, endIndex + 1);
  const total = segment.reduce((sum, current) => sum + current, 0);
  return total / segment.length;
}

function calculateStdDev(values) {
  if (!values.length) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

const riskBadgeStyle = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700"
};

export default function HistoryChart({ history }) {
  if (!history?.length) {
    return null;
  }

  const ordered = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const yields = ordered.map((item) => toSafeNumber(item.predicted_yield_t_ha));

  const data = ordered.map((item, idx) => ({
    id: `${idx + 1}`,
    yield: toSafeNumber(item.predicted_yield_t_ha),
    movingAverage: rollingAverage(yields, idx, 3),
    crop: item.item,
    area: item.area,
    risk: item.risk_level,
    year: item.year,
    date: item.created_at,
    dateLabel: formatDate(item.created_at)
  }));

  const latest = data[data.length - 1];
  const first = data[0];
  const best = data.reduce((max, row) => (row.yield > max.yield ? row : max), data[0]);
  const average = yields.reduce((sum, value) => sum + value, 0) / yields.length;
  const trendDelta = latest.yield - first.yield;
  const trendPercent = first.yield > 0 ? (trendDelta / first.yield) * 100 : 0;
  const volatility = calculateStdDev(yields);
  const trendClass = trendDelta >= 0 ? "text-emerald-700" : "text-red-700";
  const recentRows = [...data].slice(-5).reverse();

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Prediction History Trend (t/ha)</h2>
          <p className="text-sm text-earth-600">
            {data.length} records from {formatDate(first.date)} to {formatDate(latest.date)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeStyle[latest.risk] || "bg-slate-100 text-slate-700"}`}>
          Latest Risk: {latest.risk}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-earth-100 bg-earth-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Latest Yield</p>
          <p className="mt-1 text-2xl font-black text-earth-700">{latest.yield.toFixed(2)} t/ha</p>
          <p className="mt-1 text-xs text-earth-600">{latest.crop} - {latest.area}</p>
        </article>
        <article className="rounded-xl border border-earth-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Average Yield</p>
          <p className="mt-1 text-2xl font-black text-earth-700">{average.toFixed(2)} t/ha</p>
          <p className="mt-1 text-xs text-earth-600">Across all saved predictions</p>
        </article>
        <article className="rounded-xl border border-earth-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Best Result</p>
          <p className="mt-1 text-2xl font-black text-earth-700">{best.yield.toFixed(2)} t/ha</p>
          <p className="mt-1 text-xs text-earth-600">{best.crop} - {best.area} ({best.year})</p>
        </article>
        <article className="rounded-xl border border-earth-100 bg-clay-100/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-500">Trend and Stability</p>
          <p className={`mt-1 text-2xl font-black ${trendClass}`}>
            {trendDelta >= 0 ? "+" : ""}
            {trendDelta.toFixed(2)} t/ha
          </p>
          <p className={`mt-1 text-xs ${trendClass}`}>
            {trendPercent >= 0 ? "+" : ""}
            {trendPercent.toFixed(1)}% vs first record | Volatility: {volatility.toFixed(2)}
          </p>
        </article>
      </div>

      <div className="h-[360px] rounded-xl border border-earth-100 bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d2d7cc" />
            <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={28} />
            <YAxis tickFormatter={(value) => Number(value).toFixed(1)} width={56} />
            <Legend verticalAlign="top" height={30} />
            <ReferenceLine
              y={average}
              stroke="#b7773d"
              strokeDasharray="4 4"
              label={{ value: `Avg ${average.toFixed(2)}`, fill: "#8a5d37", fontSize: 12, position: "insideTopRight" }}
            />
            <Tooltip
              formatter={(value, name) => [`${toSafeNumber(value).toFixed(2)} t/ha`, name === "movingAverage" ? "3-point Avg" : "Yield"]}
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload;
                if (!row) {
                  return label;
                }
                return `${row.crop} - ${row.area} (${row.year})`;
              }}
              contentStyle={{ borderRadius: "12px", borderColor: "#d2d7cc" }}
            />
            <Line type="monotone" dataKey="yield" name="Yield" stroke="#2d4e31" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="movingAverage" name="3-point Avg" stroke="#b7773d" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-earth-100 bg-earth-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-earth-600">Recent Predictions</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Crop</th>
                <th className="py-2 pr-3">Area</th>
                <th className="py-2 pr-3">Year</th>
                <th className="py-2 pr-3">Yield (t/ha)</th>
                <th className="py-2 pr-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map((row) => (
                <tr key={`${row.date}-${row.id}`} className="border-t border-earth-100 text-earth-700">
                  <td className="py-2 pr-3">{formatDateTime(row.date)}</td>
                  <td className="py-2 pr-3">{row.crop}</td>
                  <td className="py-2 pr-3">{row.area}</td>
                  <td className="py-2 pr-3">{row.year}</td>
                  <td className="py-2 pr-3 font-semibold">{row.yield.toFixed(2)}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeStyle[row.risk] || "bg-slate-100 text-slate-700"}`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
