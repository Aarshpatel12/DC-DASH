import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid 
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Dairy Development Dashboard";
const SHEET_ID = "1y0XZRWgW4b9rBiFaZ3QFG3SvodtbCbfN3ttt5oVJgXI"; // <--- Put your Dairy Google Sheet ID here!
const TABS = [
  { name: "Training & Extension Service", gid: "0" }, // For Sheet 4
  { name: "Entrepreneurship & Schemes", gid: "2119689777" } // For Sheet 5 (Update GID)
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];
// =========================================================================

function DairyDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsOpen(!isOpen);

  const fetchData = () => {
    setLoading(true);
    setErrorMsg("");
    
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${activeTab.gid}&t=${Date.now()}`;
    
    Papa.parse(url, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0 && String(results.data[0][0]).includes("<!DOCTYPE")) {
           setErrorMsg("Permission Denied: Please set your Google Sheet to 'Anyone with the link'.");
           setData([]);
        } else {
           setData(results.data);
        }
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Failed to load data. Check your internet connection or Sheet ID.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ==============================================================
  // SUPER-ADAPTIVE ENGINE (Handles Stacked Tables & Shifting Headers)
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const parsedData = [];
    const topMetrics = {};
    const numericKeys = new Set();
    let currentHeaders = [];

    // Helper: Strict number check (ignores dates like 2025-05-05)
    const isNumericCell = (cell) => {
        if (cell === null || cell === undefined) return false;
        const str = String(cell).trim().replace(/,/g, '');
        return str !== "" && !isNaN(str) && !str.includes("-") && !str.includes("/"); 
    };

    // Sweep through all rows top-to-bottom
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        let hasNumbers = false;
        let numCols = [];
        
        // Scan row to see if it contains valid numbers
        row.forEach((cell, idx) => {
            if (idx > 0 && isNumericCell(cell)) {
                hasNumbers = true;
                numCols.push(idx);
            }
        });

        const label1 = String(row[0] || "").trim();
        const label2 = String(row[1] || "").trim();

        // Skip "Total" summary rows to avoid doubling data in charts
        if (label1.toLowerCase().includes("total") || label2.toLowerCase().includes("total")) {
            continue; 
        }

        if (hasNumbers) {
            // It's a Data Row! 
            let rowName = label1;
            
            // Smart Date Merger: If column 2 is a date (not a number), merge them as "Start to End"
            if (label2 !== "" && !isNumericCell(label2)) {
                rowName += " to " + label2;
            } else if (!rowName && label2 !== "") {
                rowName = label2;
            }

            const dataObj = { name: rowName || `Batch ${parsedData.length + 1}`, rawRow: row };
            
            // Map the numbers to their appropriate headers
            numCols.forEach(colIdx => {
                let headerName = String(currentHeaders[colIdx] || `Metric ${colIdx}`).trim();
                if (headerName === "") headerName = `Metric ${colIdx}`;
                
                const val = parseFloat(String(row[colIdx]).replace(/,/g, ''));
                dataObj[headerName] = val;
                
                // Track globally
                numericKeys.add(headerName);
                if (!topMetrics[headerName]) topMetrics[headerName] = 0;
                topMetrics[headerName] += val;
            });
            
            parsedData.push(dataObj);
        } else {
            // It's a Text Row! Probably a Header. Update our current headers memory.
            const possibleHeaders = row.map(h => String(h || "").trim());
            if (possibleHeaders.some(h => h.length > 0)) {
                currentHeaders = possibleHeaders;
            }
        }
    }

    const chartKeys = Array.from(numericKeys);
    const filteredRows = parsedData.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return { parsedData, filteredRows, topMetrics, chartKeys };
  }, [data, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <ProfileNavbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar isOpen={isOpen} />
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto min-w-0">
          
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{DASHBOARD_TITLE}</h1>
              <p className="text-sm text-gray-500 mt-1">Training Modules & Entrepreneurship Metrics</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 flex-wrap justify-end">
              <select 
                className="border-2 border-blue-200 p-2.5 rounded-lg bg-blue-50 text-blue-900 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm w-64 shadow-sm"
                value={activeTab.name} 
                onChange={(e) => {
                  setActiveTab(TABS.find(t => t.name === e.target.value));
                  setSearchQuery("");
                }}
              >
                {TABS.map(tab => <option key={tab.name} value={tab.name}>{tab.name}</option>)}
              </select>

              <a 
                href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${activeTab.gid}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-lg shadow-sm hover:bg-blue-50 transition-all font-bold text-sm flex items-center gap-2"
              >
                📝 Edit in Excel
              </a>
              <button onClick={fetchData} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2">
                ↻ Sync Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Dairy Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics && analytics.chartKeys.length > 0 ? (
            
            <>
              {/* Dynamic Metric Cards (Generates a card for every header found) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.chartKeys.map((metricName, idx) => (
                  <MetricCard 
                    key={idx} 
                    title={`Total ${metricName}`} 
                    value={analytics.topMetrics[metricName]?.toLocaleString()} 
                    color={`text-[${COLORS[idx % COLORS.length]}]`} 
                  />
                ))}
              </div>

              {/* Dynamic Graphical Analysis */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Trainee Demographics by Batch Period</h2>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.parsedData} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                      <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                      {analytics.chartKeys.map((key, i) => (
                         <Bar key={key} dataKey={key} name={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Unified Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Unified Training Records</h2>
                  <input type="text" placeholder={`Search batches...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Training Batch Period</th>
                        {analytics.chartKeys.map((key, i) => (
                           <th key={i} className="px-4 py-3 font-bold border-r border-gray-200 text-center">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.name}
                          </td>
                          {analytics.chartKeys.map((key, cIdx) => (
                             <td key={cIdx} className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">
                               {row[key] !== undefined ? row[key].toLocaleString() : "-"}
                             </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center h-64 text-lg font-bold text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
               No valid training numbers found. Ensure the sheet has numeric data rows.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }) {
  // Extract hex code if color is in bracket format (e.g. text-[#3b82f6])
  const hexMatch = color.match(/\[(.*?)\]/);
  const colorHex = hexMatch ? hexMatch[1] : '#3b82f6';

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 truncate`} style={{ color: colorHex }}>{value || 0}</p>
    </div>
  );
}

export default DairyDashboard;