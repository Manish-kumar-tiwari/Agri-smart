import React from "react";

import HistoryChart from "./components/HistoryChart";
import PredictionForm from "./components/PredictionForm";
import ResultCard from "./components/ResultCard";
import { fetchHistory, predictYield } from "./services/api";

export default function App() {
  const [result, setResult] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadHistory = React.useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load history");
    }
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const data = await predictYield(payload);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err?.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="rounded-2xl bg-white/80 p-6 shadow-soft ring-1 ring-earth-100 md:p-8">
        <p className="inline-block rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-clay-700">
          AI Powered Farming Assistant
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-earth-900 md:text-5xl">AgriSmart</h1>
        <p className="mt-2 max-w-3xl text-sm text-earth-700 md:text-base">
          Design goal: help farmers optimize planting schedules and reduce food insecurity through AI yield prediction.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-earth-100 bg-earth-50 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-earth-700">Planting Schedule Optimization</h2>
            <p className="mt-2 text-sm text-earth-700">
              Get sowing window, irrigation strategy, and field actions based on rainfall, temperature, and crop context.
            </p>
          </article>
          <article className="rounded-xl border border-earth-100 bg-clay-100/60 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-earth-700">Food Insecurity Reduction</h2>
            <p className="mt-2 text-sm text-earth-700">
              See expected production, food security signal, and practical mitigation steps from each prediction.
            </p>
          </article>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <PredictionForm onSubmit={handleSubmit} loading={loading} />
      <ResultCard result={result} />
      <HistoryChart history={history} />
    </main>
  );
}
