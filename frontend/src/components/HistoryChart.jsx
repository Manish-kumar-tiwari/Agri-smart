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
  const average = yields.reduce((sum, value) => sum + value, 0) / yields.length;
  const recentRows = [...data].reverse().slice(0, 4);

  return (
    <section className="card card-strong h-full space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">Historical Analytics</p>
          <h2 className="heading-lg text-xl">Prediction History Trend (t/ha)</h2>
          <p className="body-muted text-sm">
            {data.length} records from {formatDate(first.date)} to {formatDate(latest.date)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeStyle[latest.risk] || "bg-slate-100 text-slate-700"}`}>
          Latest Risk: {latest.risk}
        </span>
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
              stroke="#5f9f7b"
              strokeDasharray="4 4"
              label={{ value: `Avg ${average.toFixed(2)}`, fill: "#3f7b5d", fontSize: 12, position: "insideTopRight" }}
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
            <Line type="monotone" dataKey="movingAverage" name="3-point Avg" stroke="#67a884" strokeWidth={2} strokeDasharray="6 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-earth-100 bg-earth-50 p-4">
        <h3 className="heading-md text-sm uppercase tracking-wide">Recent Predictions</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="body-copy min-w-full text-sm">
            <thead>
              <tr className="body-muted text-left text-xs uppercase tracking-wide">
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
                <tr key={`${row.date}-${row.id}`} className="border-t border-earth-100">
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
