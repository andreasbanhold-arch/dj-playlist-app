import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";

function formatTime(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    if (value < 1) {
      const totalSeconds = Math.round(value * 24 * 60 * 60);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (typeof value === "string") {
    const clean = value.trim();

    if (/^\d{1,2}:\d{2}:\d{2}$/.test(clean)) {
      const [, m, s] = clean.split(":").map(Number);
      return `${m}:${s.toString().padStart(2, "0")}`;
    }

    if (/^\d+:\d{2}$/.test(clean)) {
      const seconds = parseInt(clean.split(":")[0], 10);
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return `${minutes}:${rest.toString().padStart(2, "0")}`;
    }

    if (/^\d+$/.test(clean)) {
      const seconds = parseInt(clean, 10);
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      return `${minutes}:${rest.toString().padStart(2, "0")}`;
    }
  }

  return "??";
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

          if (firstCell.toUpperCase().includes("BLOCK")) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { name: firstCell, tracks: [] };
          } else if (currentBlock && row.length > 2) {
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
              bpm: row[1],
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
      <h1>DJ Playlist (DEBUG)</h1>

      {!data && <input type="file" onChange={handleFile} />}

      {data && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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

          {!block &&
            data[tab].map((b, i) => (
              <div key={i} onClick={() => setBlock(b)} style={{ cursor: "pointer" }}>
                {b.name}
              </div>
            ))}

          {block && (
            <div>
              <button onClick={() => setBlock(null)}>← zurück</button>
              <h2>{block.name}</h2>

              {block.tracks.map((t, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div>
                    {t.artist} – {t.title} – {t.bpm} BPM – {formatTime(t.duration)}
                  </div>

                  {/* 🔴 DEBUG INFO */}
                  <div style={{ fontSize: 12, color: "red" }}>
                    RAW: {JSON.stringify(t.duration)} | TYPE: {typeof t.duration}
                  </div>
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
