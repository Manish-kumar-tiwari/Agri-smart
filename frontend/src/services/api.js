import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
});

export const predictYield = async (payload) => {
  const { data } = await api.post("/predict", payload);
  return data;
};

export const fetchHistory = async () => {
  const { data } = await api.get("/history", { params: { limit: 20 } });
  return data;
};
