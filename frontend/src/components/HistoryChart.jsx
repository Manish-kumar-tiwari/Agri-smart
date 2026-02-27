import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function HistoryChart({ history }) {
  if (!history?.length) {
    return null;
  }

  const data = [...history].reverse().map((item, idx) => ({
    id: idx + 1,
    yield: Number(item.predicted_yield_t_ha?.toFixed?.(2) || item.predicted_yield_t_ha || 0),
    crop: item.item,
    date: item.created_at
  }));

  return (
    <section className="card h-[340px]">
      <h2 className="mb-4 text-xl font-bold">Prediction History Trend (t/ha)</h2>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip
            formatter={(value) => [`${value} t/ha`, "Yield"]}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload;
              if (!row) return label;
              return `${row.crop} - ${formatDate(row.date)}`;
            }}
          />
          <Line type="monotone" dataKey="yield" stroke="#2d4e31" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
