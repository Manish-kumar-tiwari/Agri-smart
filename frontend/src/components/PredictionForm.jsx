import React from "react";
import sproutIcon from "../assets/sprout-icon.svg";

const initialForm = {
  area: "",
  item: "",
  year: "",
  average_rain_fall_mm_per_year: "",
  pesticides_tonnes: "",
  avg_temp: "",
  farm_area_hectares: "1",
};

const cropSuggestions = [
  "Maize",
  "Rice, paddy",
  "Sorghum",
  "Wheat",
  "Soybeans",
  "Potatoes",
  "Cassava",
  "Sweet potatoes",
  "Yams",
  "Plantains and others",
];

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
  min,
  max,
  placeholder,
  hint,
}) {
  return (
    <label className="heading-md flex flex-col gap-1.5 text-sm">
      <span>{label}</span>
      <input
        className="rounded-xl border border-earth-100 bg-white px-3 py-2.5 text-earth-900 outline-none transition focus:border-earth-500 focus:ring-2 focus:ring-earth-100"
        name={name}
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={onChange}
        required
      />
      {hint ? (
        <span className="body-muted text-xs font-medium">{hint}</span>
      ) : null}
    </label>
  );
}

export default function PredictionForm({ onSubmit, loading }) {
  const [form, setForm] = React.useState(initialForm);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      area: form.area.trim(),
      item: form.item.trim(),
      year: Number(form.year),
      average_rain_fall_mm_per_year: Number(form.average_rain_fall_mm_per_year),
      pesticides_tonnes: Number(form.pesticides_tonnes),
      avg_temp: Number(form.avg_temp),
      farm_area_hectares: Number(form.farm_area_hectares),
    };
    onSubmit(payload);
  };

  return (
    <form className="card card-strong space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="section-label">Input Parameters</p>
        <div className="mt-2 flex items-center gap-2">
          <img
            src={sproutIcon}
            alt="Plant icon"
            className="h-8 w-8 rounded-lg border border-earth-100 bg-white p-1"
          />
          <h2 className="heading-lg text-xl">Yield Prediction Form</h2>
        </div>
        <p className="body-copy mt-1 text-sm">
          Fill each field with realistic farm values for stronger prediction
          quality.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Area (Country/Region)"
          name="area"
          value={form.area}
          onChange={handleChange}
          placeholder="e.g. India"
          hint="Used as regional context for model lookup."
        />

        <label className="heading-md flex flex-col gap-1.5 text-sm">
          <span>Crop Item</span>
          <input
            className="rounded-xl border border-earth-100 bg-white px-3 py-2.5 text-earth-900 outline-none transition focus:border-earth-900 focus:ring-2 focus:ring-earth-100"
            name="item"
            value={form.item}
            onChange={handleChange}
            list="crop-options"
            placeholder="Select or type crop"
            required
          />
          <datalist id="crop-options">
            {cropSuggestions.map((crop) => (
              <option key={crop} value={crop} />
            ))}
          </datalist>
          <span className="body-muted text-xs font-medium">
            You can type custom crop names too.
          </span>
        </label>

        <Field
          label="Year"
          name="year"
          value={form.year}
          onChange={handleChange}
          type="number"
          min="1990"
          max="2100"
          placeholder="e.g. 2026"
        />
        <Field
          label="Average Rainfall (mm/year)"
          name="average_rain_fall_mm_per_year"
          value={form.average_rain_fall_mm_per_year}
          onChange={handleChange}
          type="number"
          min="0"
          max="10000"
          placeholder="e.g. 850"
        />
        <Field
          label="Pesticides (tonnes)"
          name="pesticides_tonnes"
          value={form.pesticides_tonnes}
          onChange={handleChange}
          type="number"
          step="0.01"
          min="0"
          max="1000000"
          placeholder="e.g. 120.50"
        />
        <Field
          label="Average Temperature (C)"
          name="avg_temp"
          value={form.avg_temp}
          onChange={handleChange}
          type="number"
          step="0.1"
          min="-30"
          max="60"
          placeholder="e.g. 25.4"
        />
        <Field
          label="Farm Area (hectares)"
          name="farm_area_hectares"
          value={form.farm_area_hectares}
          onChange={handleChange}
          type="number"
          step="0.01"
          min="0.01"
          max="100000"
          placeholder="e.g. 10"
          hint="Used to estimate total production in tons."
        />
      </div>

      <div className="body-copy rounded-xl border border-earth-100 bg-earth-50 px-4 py-3 text-xs">
        Data tip: keep units consistent. Rainfall is annual `mm/year`,
        temperature is in `C`, and farm size is `hectares`.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-xl border border-[#58aa46] bg-[#599f40] px-5 py-3 text-sm font-semibold transition hover:bg-[#95cba9] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Running Prediction..." : "Generate Prediction"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#58aa46] bg-[#599f40] px-5 py-3 text-sm font-semibold transition hover:bg-[#c8e2d3]"
          onClick={() => setForm(initialForm)}
          disabled={loading}
        >
          Reset Form
        </button>
      </div>
    </form>
  );
}

