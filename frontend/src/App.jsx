import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function App() {
  const [status, setStatus] = useState("memuat...");

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((error) => setStatus(`gagal: ${error.message}`));
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Xora</h1>
      <p>Frontend jalan di http://localhost:5173</p>
      <p>Status backend: {status}</p>
    </main>
  );
}