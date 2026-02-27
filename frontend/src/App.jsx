import React from "react";

import cropHero from "./assets/crop-hero.svg";
import sproutIcon from "./assets/sprout-icon.svg";
import HistoryChart from "./components/HistoryChart";
import PredictionForm from "./components/PredictionForm";
import ResultCard from "./components/ResultCard";
import { fetchHistory, predictYield } from "./services/api";

function formatDateTime(value) {
  if (!value) {
    return "No runs yet";
  }
  return new Date(value).toLocaleString();
}

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

  const latestHistory = history?.[0] || null;
  const totalPredictions = history.length;
  const averageYield = totalPredictions
    ? history.reduce((sum, item) => sum + Number(item.predicted_yield_t_ha || 0), 0) / totalPredictions
    : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 lg:py-10">
      <header className="card card-strong relative overflow-hidden md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-earth-100/50 blur-xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-clay-100/70 blur-xl" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-clay-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-clay-700">
              AI Powered Farming Assistant
            </p>
            <div className="mt-3 flex items-center gap-3">
              <img src={sproutIcon} alt="Sprout icon" className="h-10 w-10 rounded-xl border border-earth-100 bg-white/80 p-1.5" />
              <h1 className="heading-xl text-3xl tracking-tight md:text-5xl">AgriSmart</h1>
            </div>
            <p className="body-copy mt-2 max-w-3xl text-sm md:text-base">
              A production-ready dashboard to optimize planting strategy and reduce food insecurity using yield intelligence.
            </p>
          </div>
          <div className="body-copy rounded-xl border border-earth-100 bg-white/75 px-4 py-3 text-sm backdrop-blur">
            <p className="section-label">System Status</p>
            <p className="heading-md mt-1">{loading ? "Running prediction..." : "Ready for input"}</p>
            <p className="body-muted mt-1 text-xs">Last Update: {formatDateTime(latestHistory?.created_at)}</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 hidden lg:block">
          <img
            src={cropHero}
            alt="Crop fields and plants"
            className="h-44 w-full rounded-2xl border border-earth-100/80 object-cover shadow-[0_10px_25px_rgba(45,78,49,0.08)]"
          />
        </div>

        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="kpi-card">
            <p className="section-label">Total Predictions</p>
            <p className="metric-value mt-2 text-3xl">{totalPredictions}</p>
          </article>
          <article className="kpi-card">
            <p className="section-label">Average Yield</p>
            <p className="metric-value mt-2 text-3xl">{averageYield.toFixed(2)} t/ha</p>
          </article>
          <article className="kpi-card">
            <p className="section-label">Latest Crop</p>
            <p className="heading-md mt-2 text-lg">{latestHistory?.item || "N/A"}</p>
            <p className="body-muted mt-1 text-xs">{latestHistory?.area || "No location yet"}</p>
          </article>
          <article className="kpi-card">
            <p className="section-label">Latest Risk</p>
            <p className="heading-md mt-2 text-lg">{latestHistory?.risk_level || "N/A"}</p>
            <p className="body-muted mt-1 text-xs">
              {latestHistory ? `${Number(latestHistory.predicted_yield_t_ha || 0).toFixed(2)} t/ha` : "No prediction result yet"}
            </p>
          </article>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
          <p className="font-semibold">Unable to complete request</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-6 xl:auto-rows-min xl:grid-cols-5">
        <div className="xl:col-span-2">
          <PredictionForm onSubmit={handleSubmit} loading={loading} />
        </div>
        <div className="xl:col-span-3 xl:row-span-2">
          {result ? (
            <ResultCard result={result} />
          ) : (
            <section className="card card-strong h-full min-h-[240px]">
              <p className="section-label">Prediction Output</p>
              <h2 className="heading-lg mt-2 text-2xl">No prediction generated yet</h2>
              <p className="body-copy mt-3 max-w-xl text-sm">
                Submit the form to view yield metrics, risk level, food security signal, planting schedule, and AI advisory.
              </p>
            </section>
          )}
        </div>
        <div className="xl:col-span-2">
          <HistoryChart history={history} />
        </div>
      </section>

      <footer className="body-muted pb-2 text-center text-xs">
        AgriSmart Decision Support Dashboard
      </footer>
    </main>
  );
}
