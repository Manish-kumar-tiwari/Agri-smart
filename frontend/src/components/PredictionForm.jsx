import React from "react";

const initialForm = {
  area: "",
  item: "",
  year: "",
  average_rain_fall_mm_per_year: "",
  pesticides_tonnes: "",
  avg_temp: "",
  farm_area_hectares: "1"
};

function Field({ label, name, value, onChange, type = "text", step }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-earth-700">
      {label}
      <input
        className="rounded-lg border border-earth-100 bg-white px-3 py-2 text-earth-900 outline-none transition focus:border-earth-500"
        name={name}
        type={type}
        value={value}
        step={step}
        onChange={onChange}
        required
      />
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
      area: form.area,
      item: form.item,
      year: Number(form.year),
      average_rain_fall_mm_per_year: Number(form.average_rain_fall_mm_per_year),
      pesticides_tonnes: Number(form.pesticides_tonnes),
      avg_temp: Number(form.avg_temp),
      farm_area_hectares: Number(form.farm_area_hectares)
    };
    onSubmit(payload);
  };

  return (
    <form className="card grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Field label="Area (Country/Region)" name="area" value={form.area} onChange={handleChange} />
      <Field label="Crop Item" name="item" value={form.item} onChange={handleChange} />
      <Field label="Year" name="year" value={form.year} onChange={handleChange} type="number" />
      <Field
        label="Average Rainfall (mm/year)"
        name="average_rain_fall_mm_per_year"
        value={form.average_rain_fall_mm_per_year}
        onChange={handleChange}
        type="number"
      />
      <Field
        label="Pesticides (tonnes)"
        name="pesticides_tonnes"
        value={form.pesticides_tonnes}
        onChange={handleChange}
        type="number"
        step="0.01"
      />
      <Field label="Average Temperature (C)" name="avg_temp" value={form.avg_temp} onChange={handleChange} type="number" step="0.1" />
      <Field
        label="Farm Area (hectares)"
        name="farm_area_hectares"
        value={form.farm_area_hectares}
        onChange={handleChange}
        type="number"
        step="0.01"
      />

      <button
        type="submit"
        className="md:col-span-2 rounded-lg bg-earth-700 px-4 py-3 font-semibold text-white transition hover:bg-earth-900 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict Yield"}
      </button>
    </form>
  );
}
