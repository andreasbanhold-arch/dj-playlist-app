import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";

// 🔥 ULTRA-ROBUSTE ZEIT-FUNKTION
function formatTime(value) {
  if (value === null || value === undefined || value === "") return "";

  // 👉 ZAHLEN (Excel oder Sekunden)
  if (typeof value === "number") {
    // Excel-Zeit (z. B. 0.1833)
    if (value < 1) {
      const totalSeconds = Math.round(value * 24 * 60 * 60);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // Sekunden (z. B. 199)
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // 👉 STRINGS
  if (typeof value === "string") {
    const clean = value.trim();

    // "00:03:23"
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(clean)) {
      const [, m, s] = clean.split(":").map(Number);
      return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // "199:00" → Sekunden
    if (/^\d+:\d{2}$/.test(clean)) {
      const seconds = parseInt(clean.split(":")[0], 10);
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return `${minutes}:${rest.toString().padStart(2, "0")}`;
    }

    // "199" → Sekunden
    if (/^\d+$/.test(clean)) {
      const seconds = parseInt(clean, 10);
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return `${minutes}:${rest.toString().padStart(2, "0")}`;
    }
  }

  return "";
}

function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(null);
  const [block, setBlock] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const parsed = {};

      wb.SheetNames.forEach((sheetName) => {
        const ws = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

        let blocks = [];
        let currentBlock = null;

        ws.forEach((row) => {
          if (!row || row.length === 0) return;

          const firstCell = row[0] ? row[0].toString() : "";

          // 👉 BLOCK erkennen
          if (firstCell.toUpperCase().includes("BLOCK")) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { name: firstCell, tracks: [] };
          }

          // 👉 TRACK erkennen
          else if (currentBlock && row.length > 2) {
            const full = row[0] || "";

            let artist = "";
            let title = "";

            if (full.includes(" - ")) {
              const parts = full.split(" - ");
              artist = parts[0];
              title = parts.slice(1).join(" - ");
            } else {
              title = full;
            }

            currentBlock.tracks.push({
              artist,
              title,
              bpm: row[1] || "",
              duration: row[2]
            });
          }
        });

        if (currentBlock) blocks.push(currentBlock);
        if (blocks.length > 0) parsed[sheetName] = blocks;
      });

      setData(parsed);
      setTab(Object.keys(parsed)[0]);
      setBlock(null);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>DJ Playlist</h1>

      {!data && <input type="file" onChange={handleFile} />}

      {data && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 10 }}>
            {Object.keys(data).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setBlock(null);
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Block-Liste */}
          {!block &&
            data[tab].map((b, i) => (
              <div
                key={i}
                onClick={() => setBlock(b)}
                style={{ marginBottom: 8, cursor: "pointer" }}
              >
                {b.name}
              </div>
            ))}

          {/* Tracks */}
          {block && (
            <div>
              <button onClick={() => setBlock(null)}>← zurück</button>
              <h2>{block.name}</h2>

              {block.tracks.map((t, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  {t.artist} – {t.title}
                  {t.bpm ? ` – ${t.bpm} BPM` : ""}
                  {t.duration ? ` – ${formatTime(t.duration)}` : ""}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
