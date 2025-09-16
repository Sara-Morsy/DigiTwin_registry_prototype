import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

/* ---------- tiny utils ---------- */
const uniq = (arr) => Array.from(new Set(arr));

/* ---------- Minimal bar chart (kept for Charts tab) ---------- */
function BarChart({ data, width = 800, height = 320, label = "Count" }) {
  const pad = 40;
  const w = width;
  const h = height;
  const max = Math.max(1, ...data.map((d) => d.count));
  const barW = (w - pad * 2) / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#CBD5E1" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#CBD5E1" />
      <text x={pad} y={20} className="fill-slate-500 text-[10px]">{label}</text>
      {data.map((d, i) => {
        const x = pad + i * barW + 4;
        const bh = Math.max(2, ((h - pad * 2) * d.count) / max);
        const y = h - pad - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - 8} height={bh} rx="4" className="fill-slate-300" />
            <text x={x + (barW - 8) / 2} y={h - pad + 12} className="fill-slate-500 text-[10px]" textAnchor="middle">
              {String(d.value).slice(0, 12)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- multi-select checkboxes ---------- */
function MultiSelect({ label, options, values, onChange }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs font-medium text-slate-500 mb-2">{label}</div>
      <div className="max-h-40 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const id = `${label}-${opt}`;
          const checked = values.includes(opt);
          return (
            <label htmlFor={id} key={opt} className="flex items-center gap-2 text-sm">
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(checked ? values.filter((v) => v !== opt) : [...values, opt])
                }
              />
              <span className="truncate">{opt}</span>
            </label>
          );
        })}
      </div>
      {values.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="mt-2 text-xs text-blue-600 hover:underline">
          Clear
        </button>
      )}
    </div>
  );
}

/* ---------- Detail card grouped by node ---------- */
function DetailCard({ id, allRows, onClose }) {
  const items = useMemo(() => allRows.filter((r) => r.ID === id), [allRows, id]);
  const byNode = useMemo(() => {
    const m = new Map();
    items.forEach((r) => {
      const arr = m.get(r.node) || [];
      arr.push(r.value);
      m.set(r.node, arr);
    });
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Details for <code className="px-2 py-0.5 bg-slate-100 rounded">{id}</code>
        </div>
        <button onClick={onClose} className="text-sm text-slate-600 hover:underline">Close</button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {byNode.map(([node, values]) => (
          <div key={node} className="rounded-xl border p-3 bg-white">
            <div className="text-sm font-medium">{node}</div>
            <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
              {values.map((v, i) => <li key={i}>{String(v)}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- NEW: Network graph (IDs ↔ values for a chosen node type) ---------- */
function NetworkGraph({ rows, graphNode }) {
  // Build bipartite sets
  const ids = uniq(rows.map(r => r.ID));
  const values = uniq(rows.filter(r => r.node === graphNode).map(r => String(r.value)));

  // Layout: two vertical columns with gentle spreading.
  const width = 1000, height = 600, pad = 80;
  const leftX = pad;
  const rightX = width - pad;
  const idY = (i) => pad + (i * (height - pad * 2)) / Math.max(1, ids.length - 1);
  const valY = (i) => pad + (i * (height - pad * 2)) / Math.max(1, values.length - 1);

  const idIndex = new Map(ids.map((id, i) => [id, i]));
  const valIndex = new Map(values.map((v, i) => [v, i]));

  // Edges: ID -> value (only for selected graphNode)
  const edges = rows
    .filter(r => r.node === graphNode)
    .map(r => ({ id: r.ID, value: String(r.value) }));

  return (
    <div className="overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[min(1000px,100%)] h-auto">
        {/* edges */}
        <g stroke="#CBD5E1" strokeOpacity="0.7">
          {edges.map((e, i) => (
            <line
              key={i}
              x1={leftX + 20}
              y1={idY(idIndex.get(e.id))}
              x2={rightX - 20}
              y2={valY(valIndex.get(e.value))}
            />
          ))}
        </g>

        {/* left: IDs */}
        <g>
          {ids.map((id, i) => (
            <g key={id}>
              <circle cx={leftX} cy={idY(i)} r="6" fill="#0EA5E9" />
              {i % 3 === 0 && ( // not every ID needs a label; keep it readable
                <text x={leftX + 10} y={idY(i) + 4} className="text-[10px] fill-slate-600">
                  {id}
                </text>
              )}
            </g>
          ))}
          <text x={leftX} y={24} className="fill-slate-500 text-xs">IDs</text>
        </g>

        {/* right: Values for graphNode */}
        <g>
          {values.map((v, i) => (
            <g key={v}>
              <circle cx={rightX} cy={valY(i)} r="12" fill="#94A3B8" />
              <text x={rightX - 16} y={valY(i) + 4} textAnchor="end" className="text-[11px] fill-slate-700">
                {v}
              </text>
            </g>
          ))}
          <text x={rightX} y={24} textAnchor="end" className="fill-slate-500 text-xs">
            Values of “{graphNode}”
          </text>
        </g>
      </svg>
      <p className="mt-2 text-xs text-slate-500">
        Each line connects an <strong>ID</strong> to its <strong>{graphNode}</strong> value.
      </p>
    </div>
  );
}

/* ---------- main app ---------- */
export default function ExploreApp() {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);

  // Controls
  const [q, setQ] = useState("");
  const [domains, setDomains] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [mode, setMode] = useState("Table"); // Table | Charts | Network
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // load CSV
  useEffect(() => {
    Papa.parse(`${import.meta.env.BASE_URL}Final_dt.csv`, {
      header: true, dynamicTyping: true, download: true, skipEmptyLines: true,
      complete: (res) => { setRows(res.data); setReady(true); },
    });
  }, []);

  // options
  const domainOptions = useMemo(() => {
    const vals = rows.filter(r => r.node === "Scientific domain").map(r => String(r.value).trim()).filter(Boolean);
    return uniq(vals).sort();
  }, [rows]);
  const nodeOptions = useMemo(() => uniq(rows.map(r => r.node).filter(Boolean)).sort(), [rows]);

  // apply filters
  const filtered = useMemo(() => {
    let f = rows;
    const s = q.trim().toLowerCase();
    if (s) {
      f = f.filter(r =>
        String(r.ID ?? "").toLowerCase().includes(s) ||
        String(r.node ?? "").toLowerCase().includes(s) ||
        String(r.value ?? "").toLowerCase().includes(s)
      );
    }
    if (domains.length > 0) {
      const allowedIds = new Set(
        rows.filter(r => r.node === "Scientific domain" && domains.includes(String(r.value))).map(r => r.ID)
      );
      f = f.filter(r => allowedIds.has(r.ID));
    }
    if (nodes.length > 0) f = f.filter(r => nodes.includes(r.node));
    return f;
  }, [rows, q, domains, nodes]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [q, domains, nodes]);
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  // charts data (reuse from previous version)
  const [chartNode, setChartNode] = useState("");
  const topValues = useMemo(() => {
    const n = chartNode || nodes[0] || "Scientific domain";
    const counts = new Map();
    filtered.filter(r => r.node === n).forEach(r => counts.set(r.value, (counts.get(r.value) || 0) + 1));
    const arr = Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    return { node: n, data: arr.slice(0, 20) };
  }, [filtered, chartNode, nodes]);

  // network graph node type
  const [graphNode, setGraphNode] = useState("Scientific domain");

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-3">
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Search IDs, nodes, values…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <MultiSelect label="Scientific Domain" options={domainOptions} values={domains} onChange={setDomains} />
        <MultiSelect label="Node" options={nodeOptions} values={nodes} onChange={setNodes} />
      </div>

      {/* Mode switch */}
      <div className="flex gap-2 text-sm">
        {["Table", "Charts", "Network"].map((v) => (
          <button
            key={v}
            onClick={() => setMode(v)}
            className={`rounded-full px-4 py-2 border ${mode === v ? "bg-black text-white" : "bg-white hover:bg-slate-50"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="text-sm text-slate-600">Loading data…</div>
      ) : mode === "Table" ? (
        <>
          <div className="rounded-2xl border overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  {["ID", "node", "value"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={i} className={i % 2 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-1">
                      <button className="text-blue-600 hover:underline" onClick={() => setSelectedId(r.ID)}>{r.ID}</button>
                    </td>
                    <td className="px-3 py-1">{String(r.node ?? "")}</td>
                    <td className="px-3 py-1">{String(r.value ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              <button className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</button>
            </div>
          </div>

          {selectedId && <DetailCard id={selectedId} allRows={rows} onClose={() => setSelectedId("")} />}
        </>
      ) : mode === "Charts" ? (
        <div className="rounded-2xl border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="font-medium">
              Top values for node:{" "}
              <select className="ml-1 rounded border px-2 py-1 text-sm" value={chartNode || topValues.node} onChange={(e) => setChartNode(e.target.value)}>
                {nodeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="text-sm text-slate-500">Filtered rows: <strong>{filtered.length}</strong></div>
          </div>
          {topValues.data.length === 0 ? (
            <div className="text-sm text-slate-600">No data for the current selection.</div>
          ) : (
            <BarChart data={topValues.data} label="Count" />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="font-medium">Network view</div>
            <label className="text-sm text-slate-600">
              Node type:&nbsp;
              <select className="rounded border px-2 py-1 text-sm" value={graphNode} onChange={(e) => setGraphNode(e.target.value)}>
                {nodeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="text-sm text-slate-500">Filtered rows: <strong>{filtered.length}</strong></div>
          </div>
          {filtered.some(r => r.node === graphNode) ? (
            <NetworkGraph rows={filtered} graphNode={graphNode} />
          ) : (
            <div className="text-sm text-slate-600">No edges for the selected node type with current filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
