
import { useState } from 'react'
import Papa from 'papaparse'

export default function CsvExplorer(){
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [error, setError] = useState('')

  function onFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data)
        setHeaders(results.meta.fields || [])
      },
      error: (err) => setError(String(err))
    })
  }

  return (
    <div className="space-y-4 mt-6">
      <input type="file" accept=".csv" onChange={onFile} className="block" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length>0 && (
        <div className="overflow-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0,100).map((r,i)=> (
                <tr key={i} className={i%2? 'bg-white':'bg-slate-50'}>
                  {headers.map(h => <td key={h} className="px-3 py-1 whitespace-nowrap">{String(r[h] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
