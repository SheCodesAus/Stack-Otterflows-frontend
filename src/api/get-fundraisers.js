// src/api/get-fundraisers.js

// You can adjust the URL later to point at your real backend
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"; // or whatever your DRF base will be

export default async function getFundraisers() {
  try {
    const response = await fetch(`${API_BASE}/fundraisers/`);
    if (!response.ok) {
      throw new Error(`Failed to load fundraisers: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    return []; // This means the data is stubbed. 
  }
}