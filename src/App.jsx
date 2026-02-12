// src/App.jsx

import { useState } from "react";

async function fetchConstellation(prompt) {
  const res = await fetch("/api/constellation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} - ${text}`);
  }

  return res.json();
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchConstellation(prompt.trim());
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050510",
        color: "#f7f7ff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: "100%",
          background: "#0b0b1a",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #222",
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Filament (test shell)</h1>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
          This is a minimal version just to verify your serverless API is working.
          Type a vibe / prompt below and we&apos;ll show the raw JSON response.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you’re in the mood for…"
            style={{
              width: "100%",
              minHeight: 80,
              borderRadius: 8,
              border: "1px solid #333",
              background: "#050510",
              color: "#f7f7ff",
              padding: 10,
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: loading ? "#444" : "#FFE66D",
              color: "#151515",
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Weaving threads…" : "Generate constellation (test)"}
          </button>
        </form>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#ff8080",
              marginBottom: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <pre
            style={{
              marginTop: 12,
              fontSize: 11,
              background: "#050510",
              borderRadius: 8,
              padding: 12,
              border: "1px solid #222",
              maxHeight: 260,
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;