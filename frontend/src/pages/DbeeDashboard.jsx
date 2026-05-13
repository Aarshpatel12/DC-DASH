import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';

// 1. YOUR DBEE GOOGLE SHEET ID
const SHEET_ID = "1ICFBQyJLNJMOQPVurVSCnLGbzrGOI68qBunnsRBSiE8"; 

// 2. THE GIDs FOR YOUR DBEE TABS
const TABS = [
  { name: "Employment & Placements", gid: "0" }, 
  { name: "Skill Training & Self-Employment", gid: "53203241" } // Make sure this is your real GID!
];

function DbeeDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Fetch data from Google Sheets
  const fetchData = () => {
    setLoading(true);
    setErrorMsg("");
    
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${activeTab.gid}&t=${Date.now()}`;
    
    Papa.parse(url, {
      download: true,
      header: false, // Parse as 2D array to bypass complex Excel headers
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0 && String(results.data[0][0]).includes("<!DOCTYPE")) {
           setErrorMsg("Permission Denied: Please set your DBEE Google Sheet to 'Anyone with the link'.");
           setData([]);
        } else {
           setData(results.data);
        }
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Failed to load DBEE data. Check your internet connection.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ==============================================================
  // SUPERCHARGED DYNAMIC ENGINE (Handles Merged Cells & Sub-categories)
  // ==============================================================
  const dynamicData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Find the REAL header row (case insensitive)
    const headerIdx = data.findIndex(row => 
      row.some(cell => String(cell).toLowerCase().includes("parameters") || String(cell).toLowerCase().includes("sr.no"))
    );
    if (headerIdx === -1) return null;

    const rawHeaders = data[headerIdx];
    
    // 2. Find column locations dynamically
    const paramColIdx = Math.max(0, rawHeaders.findIndex(h => String(h).toLowerCase().includes("parameters")));
    const targetColIdx = rawHeaders.findIndex(h => String(h).toLowerCase().includes("yearly target"));
    const totalColIdx = rawHeaders.findIndex(h => String(h).toLowerCase().includes("total"));
    
    // 3. Extract the Months safely
    let monthStartIdx = targetColIdx > -1 ? targetColIdx + 1 : paramColIdx + 3;
    let monthEndIdx = totalColIdx > -1 ? totalColIdx : rawHeaders.length;
    
    const months = [];
    const monthIndices = [];
    for(let i = monthStartIdx; i < monthEndIdx; i++) {
       if (rawHeaders[i] && String(rawHeaders[i]).trim() !== "") {
           months.push(rawHeaders[i]);
           monthIndices.push(i); // Keep track of the exact column index
       }
    }

    if (months.length === 0) return null;

    // 4. Extract Parameters and Table Rows
    const parameters = [];
    const tableRows = [];
    
    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        
        // Grab the name (checking multiple columns due to Excel merging)
        const c1 = String(row[paramColIdx] || "").trim();
        const c2 = String(row[paramColIdx + 1] || "").trim();
        const c3 = String(row[paramColIdx + 2] || "").trim();
        const name = c3 || c2 || c1; // Use the deepest available name
        
        if (name && name !== "" && !name.toLowerCase().includes("total no. of")) {
            // CRUCIAL: Only add this row if it actually contains numbers in the month columns!
            // This skips category headers like "Skill Training" that have blank rows.
            const hasData = monthIndices.some(idx => !isNaN(parseFloat(row[idx])));
            
            if (hasData) {
                parameters.push({ name, rowIdx: i });
                tableRows.push({ name, rawRow: row });
            }
        }
    }

    if (parameters.length === 0) return null;

    // 5. Select the top 4 parameters to chart
    const chartKeys = parameters.slice(0, 4).map(p => p.name);

    // 6. Transpose Data for Time-Series Charts (Months -> X-Axis)
    const chartData = months.map((month, mIdx) => {
        const colIdx = monthIndices[mIdx];
        const date = new Date(month);
        const monthLabel = isNaN(date.getTime()) ? month : date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

        const dataObj = { name: monthLabel };
        
        chartKeys.forEach(key => {
            const p = parameters.find(p => p.name === key);
            const val = parseFloat(data[p.rowIdx][colIdx]);
            dataObj[key] = isNaN(val) ? 0 : val;
        });
        
        return dataObj;
    });

    // 7. Extract Totals for the Top Metric Cards
    const topMetrics = {};
    if (totalColIdx > -1) {
        chartKeys.forEach(key => {
            const p = parameters.find(p => p.name === key);
            const val = parseFloat(data[p.rowIdx][totalColIdx]);
            topMetrics[key] = isNaN(val) ? 0 : val;
        });
    } else {
        // Auto-calculate if "Total" column is missing
        chartKeys.forEach(key => {
            const p = parameters.find(p => p.name === key);
            let sum = 0;
            monthIndices.forEach(idx => {
                const val = parseFloat(data[p.rowIdx][idx]);
                if (!isNaN(val)) sum += val;
            });
            topMetrics[key] = sum;
        });
    }

    // 8. Filter Table Rows based on Search
    const filteredRows = tableRows.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return { months, monthIndices, chartData, chartKeys, topMetrics, filteredRows, totalColIdx };
  }, [data, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <ProfileNavbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar isOpen={isOpen} />
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto min-w-0">
          
          {/* Header & Global Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">DBEE Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Employment, Placement & Training Analytics</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 flex-wrap justify-end">
              <select 
                className="border-2 border-blue-200 p-2.5 rounded-lg bg-blue-50 text-blue-900 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm w-64 shadow-sm truncate"
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
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Live DBEE Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : dynamicData ? (
            
            /* ========================================================= */
            /* DYNAMIC DBEE DASHBOARD VIEW                               */
            /* ========================================================= */
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {dynamicData.chartKeys.map((metricName, idx) => (
                  <MetricCard 
                    key={idx} 
                    title={metricName} 
                    value={dynamicData.topMetrics[metricName]?.toLocaleString()} 
                    color={idx === 0 ? "text-gray-700" : idx === 1 ? "text-blue-700" : idx === 2 ? "text-green-600" : "text-purple-600"} 
                  />
                ))}
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Bar Chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Volume Comparison by Month</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dynamicData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        {dynamicData.chartKeys.map((key, i) => (
                           <Bar key={key} dataKey={key} name={key} fill={i === 0 ? "#9ca3af" : i === 1 ? "#2563eb" : i === 2 ? "#10b981" : "#f59e0b"} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Trend Chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Achievement Trend over Time</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dynamicData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        {dynamicData.chartKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} name={key} stroke={i === 0 ? "#6b7280" : i === 1 ? "#3b82f6" : i === 2 ? "#10b981" : "#f59e0b"} strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Complete Dataset</h2>
                  <input type="text" placeholder={`Search Parameters...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Parameter</th>
                        {dynamicData.months.map((m, i) => {
                           const d = new Date(m);
                           const label = isNaN(d.getTime()) ? m : d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                           return <th key={i} className="px-4 py-3 font-bold border-r border-gray-200">{label}</th>
                        })}
                        {dynamicData.totalColIdx > -1 && <th className="px-4 py-3 font-bold bg-blue-50 text-blue-800">Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {dynamicData.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.name}
                          </td>
                          {dynamicData.monthIndices.map((colIdx, i) => (
                             <td key={i} className="px-4 py-3 text-gray-600 border-r border-gray-100">
                               {row.rawRow[colIdx] || "-"}
                             </td>
                          ))}
                          {dynamicData.totalColIdx > -1 && (
                             <td className="px-4 py-3 font-bold text-blue-600 bg-blue-50/50">
                               {row.rawRow[dynamicData.totalColIdx] || "-"}
                             </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center h-64 text-lg font-bold text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
               We couldn't structure this sheet. Ensure row headers contain "Parameters".
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 ${color} truncate`}>{value || 0}</p>
    </div>
  );
}

export default DbeeDashboard;