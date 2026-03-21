import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";

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
          } else if (currentBlock && row.length > 1) {
            currentBlock.tracks.push({
              artist: row[0] || "",
              title: row[1] || "",
              bpm: row[2] || ""
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
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
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
              <div key={i} onClick={() => setBlock(b)}>
                {b.name}
              </div>
            ))}

          {block && (
            <div>
              <button onClick={() => setBlock(null)}>← zurück</button>
              <h2>{block.name}</h2>

              {block.tracks.map((t, i) => (
                <div key={i}>
                  {t.artist} – {t.title} ({t.bpm} BPM)
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