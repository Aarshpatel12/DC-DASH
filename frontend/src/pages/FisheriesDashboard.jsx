import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Fisheries Dashboard (ਮੱਛੀ ਪਾਲਣ ਵਿਭਾਗ)";
const SHEET_ID = "1gAs-NsKzzoFKIn7MJMSyCmtceIklc1QjGHX9Ir7gREY"; 
const TABS = [
  { name: "Progress Report (ਪ੍ਰਗਤੀ ਰਿਪੋਰਟ)", gid: "0" } 
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
// =========================================================================

function FisheriesDashboard() {
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
  // FISHERIES ENGINE: Solves Split Headers & Punjabi Text Parsing
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const extractNumber = (val) => {
        if (!val) return 0;
        let cleanStr = String(val).replace(/,/g, ''); 
        const match = cleanStr.match(/(\d+(\.\d+)?)/); 
        if (match && match[0]) {
            return parseFloat(match[0]);
        }
        return 0;
    };

    // 1. Find which COLUMN contains the Item Names ("ਆਈਟਮ")
    let paramColIdx = 1; // Default to Column B
    const itemRowIdx = data.findIndex(row => 
        row && Array.isArray(row) && row.some(cell => String(cell || "").includes("ਆਈਟਮ") || String(cell || "").toLowerCase().includes("item"))
    );
    if (itemRowIdx !== -1) {
        paramColIdx = data[itemRowIdx].findIndex(cell => String(cell || "").includes("ਆਈਟਮ") || String(cell || "").toLowerCase().includes("item"));
    }

    // 2. Find which ROW contains the Months ("ਅਪ੍ਰੈਲ")
    const monthRowIdx = data.findIndex(row => 
        row && Array.isArray(row) && row.some(cell => String(cell || "").includes("ਅਪ੍ਰੈਲ") || String(cell || "").toLowerCase().includes("april"))
    );
    
    // If we can't find the month row, the layout is broken
    if (monthRowIdx === -1) return null;
    const monthRow = data[monthRowIdx];

    // 3. Map out exactly where the month columns start
    const monthStartIdx = monthRow.findIndex(cell => String(cell || "").includes("ਅਪ੍ਰੈਲ") || String(cell || "").toLowerCase().includes("april"));
    
    const months = [];
    const monthIndices = [];
    for(let i = monthStartIdx; i < monthRow.length; i++) {
        if (monthRow[i] && String(monthRow[i]).trim() !== "") {
            // Clean up month names (remove year and newlines)
            let monthName = String(monthRow[i]).replace(/,\s*\d{4}/, '').replace(/\n/g, ' ').trim();
            months.push(monthName);
            monthIndices.push(i);
        }
    }

    // 4. Extract Parameters (Rows) starting AFTER the month row
    const parameters = [];
    const tableRows = [];
    
    for (let i = monthRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        // Clean up row names
        const name = String(row[paramColIdx] || "").replace(/\n/g, ' ').trim();
        
        if (name && name !== "" && !name.includes("ਮਹੀਨੇ ਦੇ ਅੰਤ ਤੱਕ")) {
            // Check if this row actually has valid numbers in the month columns
            const hasData = monthIndices.some(idx => extractNumber(row[idx]) > 0);
            if (hasData) {
                parameters.push({ name, rowIdx: i });
                tableRows.push({ name, rawRow: row });
            }
        }
    }

    if (parameters.length === 0) return null;

    // Limit to top 4 metrics for the charts to avoid clutter
    const chartKeys = parameters.slice(0, 4).map(p => p.name);

    // 5. Transpose Data for Charting (X-axis = Months)
    const topMetrics = {};
    chartKeys.forEach(k => topMetrics[k] = 0);

    const chartData = months.map((month, mIdx) => {
        const colIdx = monthIndices[mIdx];
        const dataObj = { name: month };
        
        parameters.forEach(p => {
            const rowData = data[p.rowIdx] || [];
            const val = extractNumber(rowData[colIdx]);
            dataObj[p.name] = val;
            
            // Keep track of the MAX value for metric cards (since data is cumulative)
            if (chartKeys.includes(p.name)) {
                if (val > topMetrics[p.name]) {
                    topMetrics[p.name] = val;
                }
            }
        });
        
        return dataObj;
    });

    const filteredRows = tableRows.filter(r => String(r.name).toLowerCase().includes((searchQuery || "").toLowerCase()));

    return { months, monthIndices, chartData, chartKeys, topMetrics, filteredRows, paramColIdx };
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
              <p className="text-sm text-gray-500 mt-1">Monthly Cumulative Progress (ਮਾਸਿਕ ਪ੍ਰਗਤੀ)</p>
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
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Fisheries Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics && analytics.chartKeys.length > 0 ? (
            
            <>
              {/* Dynamic Metric Cards (Shows Max/Latest Cumulative Value) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.chartKeys.map((metricName, idx) => (
                  <MetricCard 
                    key={idx} 
                    title={metricName} 
                    value={analytics.topMetrics[metricName]?.toLocaleString(undefined, {maximumFractionDigits: 2})} 
                    color={`text-[${COLORS[idx % COLORS.length]}]`} 
                    subtitle="Current Cumulative Progress"
                  />
                ))}
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Bar Growth */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Volume Progress by Month</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                        {analytics.chartKeys.map((key, i) => (
                          <Bar key={key} dataKey={key} name={key.substring(0, 20) + "..."} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Trend Lines */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Cumulative Growth Trend</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                        {analytics.chartKeys.map((key, i) => (
                          <Line key={key} type="monotone" dataKey={key} name={key.substring(0, 20) + "..."} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Complete Records (ਸੰਪੂਰਨ ਰਿਕਾਰਡ)</h2>
                  <input type="text" placeholder={`Search Items...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Item (ਆਈਟਮ)</th>
                        {analytics.months.map((m, i) => (
                           <th key={i} className="px-4 py-3 font-bold border-r border-gray-200">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100 whitespace-pre-wrap">
                             {row.name}
                          </td>
                          {analytics.monthIndices.map((colIdx, i) => (
                             <td key={i} className="px-4 py-3 text-gray-600 border-r border-gray-100">
                               {row.rawRow[colIdx] || "-"}
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
               We couldn't structure this sheet. Ensure row headers contain text data.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, subtitle }) {
  const hexMatch = color.match(/\[(.*?)\]/);
  const colorHex = hexMatch ? hexMatch[1] : '#3b82f6';

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 truncate`} style={{ color: colorHex }}>{value || 0}</p>
      {subtitle && <span className="text-[10px] text-gray-400 mt-1">{subtitle}</span>}
    </div>
  );
}

export default FisheriesDashboard;