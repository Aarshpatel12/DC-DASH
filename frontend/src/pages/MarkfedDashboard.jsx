import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line 
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Markfed Operations Dashboard";

// 🛑 1. SHEET IDs 🛑
const WHEAT_SHEET_ID = "1FcHso6fmDgG0Tw-GLXrk-xBk_1Tisf33mY_1XWVeSkI"; 
const FERTILIZER_SHEET_ID = "15qHZEixIHjgrM20uU5TMf1HqbdoYs61GYVNTv3toHqM"; 
const PADDY_SHEET_ID = "1hahujMNV4e_Mp1dEO2uh-faQBkkjqXJzN5Xn_0_65vs"; // <--- Update this when you have the Paddy Link!

// 🛑 2. MAPPED GIDs 🛑
const TABS = [
  // --- WHEAT TABS ---
  { name: "Wheat MIS Report", sheetId: WHEAT_SHEET_ID, gid: "0" },           
  { name: "Wheat Purchase", sheetId: WHEAT_SHEET_ID, gid: "1699533549" },   
  { name: "Wheat Dispatch", sheetId: WHEAT_SHEET_ID, gid: "16404189" },     
  { name: "Storage Capacity", sheetId: WHEAT_SHEET_ID, gid: "305426794" },  
  { name: "Godown Locations", sheetId: WHEAT_SHEET_ID, gid: "1978275619" }, 

  // --- FERTILIZER TABS ---
  { name: "Fertilizer", sheetId: FERTILIZER_SHEET_ID, gid: "0" },
  { name: "Agro Chemical", sheetId: FERTILIZER_SHEET_ID, gid: "1712223460" },
  { name: "Cattlefeed", sheetId: FERTILIZER_SHEET_ID, gid: "772300609" },
  { name: "Consumer Products", sheetId: FERTILIZER_SHEET_ID, gid: "1762785239" },
  { name: "Jails", sheetId: FERTILIZER_SHEET_ID, gid: "323484711" },
  { name: "CDPO", sheetId: FERTILIZER_SHEET_ID, gid: "583298304" },

  // --- PADDY TABS ---
  { name: "Paddy Procurement", sheetId: PADDY_SHEET_ID, gid: "0" }
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
// =========================================================================

function MarkfedDashboard() {
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
    
    // Construct export URL with cache busting
    const url = `https://docs.google.com/spreadsheets/d/${activeTab.sheetId}/export?format=csv&gid=${activeTab.gid}&t=${Date.now()}`;
    
    Papa.parse(url, {
      download: true,
      header: false, 
      skipEmptyLines: true,
      complete: (results) => {
        // Basic error check for private sheets
        if (results.data.length > 0 && String(results.data[0][0]).includes("<!DOCTYPE")) {
          setErrorMsg("Permission Denied: Please set the Google Sheet for this tab to 'Anyone with the link'.");
          setData([]);
        } else {
          setData(results.data);
        }
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Failed to load data. Check your Sheet ID or GID.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ==============================================================
  // ADVANCED DATA-FIRST PARSER (Handles Stacked/Messy Headers)
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Strict number check (ignores YYYY-MM-DD dates)
    const isNumber = (val) => {
        if (!val) return false;
        const str = String(val).replace(/,/g, '').trim();
        return str !== "" && !isNaN(str) && !str.match(/^\d{4}-\d{2}-\d{2}$/);
    };

    let firstDataIdx = -1;
    let numericIndices = [];
    let labelColIdx = -1;

    // 1. Scan from top to bottom to find the FIRST row that contains actual numeric data
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        let potentialNums = [];
        let possibleLabel = -1;

        row.forEach((cell, idx) => {
            const valStr = String(cell || "").trim();
            if (isNumber(valStr)) {
                potentialNums.push(idx);
            } else if (valStr !== "" && possibleLabel === -1 && !valStr.match(/^\d+$/)) {
                possibleLabel = idx;
            }
        });

        // A valid data row needs at least 1 label and 1 number, and shouldn't be a "Total" row
        if (potentialNums.length >= 1 && possibleLabel !== -1) {
            if (!String(row[possibleLabel]).toLowerCase().includes("total")) {
                firstDataIdx = i;
                numericIndices = potentialNums;
                labelColIdx = possibleLabel;
                break;
            }
        }
    }

    if (firstDataIdx === -1) return null;

    // 2. Extract Headers by looking ABOVE the first data row
    const numericKeys = numericIndices.map(colIdx => {
        let h = String(data[firstDataIdx - 1]?.[colIdx] || "").replace(/\n/g, ' ').trim();
        if (!h && firstDataIdx >= 2) h = String(data[firstDataIdx - 2]?.[colIdx] || "").replace(/\n/g, ' ').trim();
        if (!h && firstDataIdx >= 3) h = String(data[firstDataIdx - 3]?.[colIdx] || "").replace(/\n/g, ' ').trim();
        return h || `Metric ${colIdx}`;
    });

    let labelName = String(data[firstDataIdx - 1]?.[labelColIdx] || "").replace(/\n/g, ' ').trim();
    if (!labelName && firstDataIdx >= 2) labelName = String(data[firstDataIdx - 2]?.[labelColIdx] || "").replace(/\n/g, ' ').trim();
    if (!labelName) labelName = "Item / Branch";

    // 3. Extract Chart Data and Calculate Totals
    const tableRows = [];
    const chartData = [];
    const topMetrics = {};
    numericKeys.forEach(k => topMetrics[k] = 0);

    for (let i = firstDataIdx; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        const rawLabel = String(row[labelColIdx] || "").trim();
        
        if (rawLabel && !rawLabel.toLowerCase().includes("total") && rawLabel !== "") {
            tableRows.push({ label: rawLabel, rawRow: row });
            
            // Format label for charts (Shorten dates or long strings)
            let chartLabel = rawLabel;
            if (chartLabel.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const date = new Date(chartLabel);
                chartLabel = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            } else if (chartLabel.length > 20) {
                chartLabel = chartLabel.substring(0, 20) + "...";
            }

            const chartObj = { name: chartLabel };
            let hasValidData = false;

            numericIndices.forEach((colIdx, ni) => {
                const valStr = String(row[colIdx] || "").replace(/,/g, '');
                const val = parseFloat(valStr);
                const finalVal = isNaN(val) ? 0 : val;
                
                if (finalVal > 0) hasValidData = true;
                
                chartObj[numericKeys[ni]] = finalVal;
                topMetrics[numericKeys[ni]] += finalVal;
            });

            if (hasValidData) chartData.push(chartObj);
        }
    }

    if (chartData.length === 0) return null;

    const chartKeysToUse = numericKeys.slice(0, 4);
    const filteredRows = tableRows.filter(r => r.label.toLowerCase().includes((searchQuery || "").toLowerCase()));
    const uiHeaders = data[firstDataIdx - 1] || [];

    return { headers: uiHeaders, labelColIdx, labelName, chartData, chartKeys: chartKeysToUse, topMetrics, filteredRows, numericIndices };
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
              <p className="text-sm text-gray-500 mt-1">Live tracking for {activeTab.name}</p>
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
                href={`https://docs.google.com/spreadsheets/d/${activeTab.sheetId}/edit#gid=${activeTab.gid}`}
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
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Markfed Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics && analytics.chartKeys.length > 0 ? (
            
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.chartKeys.map((metricName, idx) => (
                  <MetricCard 
                    key={idx} 
                    title={`Total ${metricName}`} 
                    value={analytics.topMetrics[metricName]?.toLocaleString(undefined, {maximumFractionDigits: 2})} 
                    color={`text-[${COLORS[idx % COLORS.length]}]`} 
                  />
                ))}
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Bar Comparison */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Volume Distribution by {analytics.labelName}</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        {analytics.chartKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} name={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Trend Lines */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Trend Analysis</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        {analytics.chartKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} name={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Complete Records</h2>
                  <input type="text" placeholder={`Search ${analytics.labelName}...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">{analytics.labelName}</th>
                        {analytics.numericIndices.map((colIdx, i) => (
                           <th key={i} className="px-4 py-3 font-bold border-r border-gray-200 text-center">
                             {String(analytics.headers[colIdx] || `Data ${i+1}`).replace(/\n/g, ' ')}
                           </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.label}
                          </td>
                          {analytics.numericIndices.map((colIdx, i) => (
                             <td key={i} className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">
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
               We couldn't parse this specific tab. Ensure it has standard table headers with numbers beneath.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }) {
  const hexMatch = color.match(/\[(.*?)\]/);
  const colorHex = hexMatch ? hexMatch[1] : '#3b82f6';

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 truncate`} style={{ color: colorHex }}>{value || 0}</p>
    </div>
  );
}

export default MarkfedDashboard;