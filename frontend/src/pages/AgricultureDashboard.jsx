import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Agriculture & Horticulture Dashboard";

// 🛑 1. PASTE YOUR GOV SCHEMES SHEET ID HERE 🛑
const SHEET_ID = "1Q7zHVgl1DLtvhJkzM7ce5_nhbLPE8BoxkNriX_Ra6xw"; 

// 🛑 2. UPDATE THE GIDs FOR YOUR TABS 🛑
const TABS = [
  { name: "Agriculture & Farmers Welfare", gid: "0" }, 
  { name: "Horticulture (NHM)", gid: "812215222" },
  { name: "Horticulture (State Plan)", gid: "2125293104" },
  { name: "Horticulture (Vikas Scheme)", gid: "206569070" }
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
// =========================================================================

function AgricultureDashboard() {
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
           setErrorMsg("Permission Denied: Please set the Google Sheet to 'Anyone with the link'.");
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
  // GOV-SCHEME ENGINE (Fills merged cells, sums months, strips text)
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Aggressive Number Extractor: "Rs 42,529" -> 42529, "1752.35q" -> 1752.35
    const extractNumber = (val) => {
        if (!val) return 0;
        let cleanStr = String(val).replace(/Rs\.?/gi, '').replace(/,/g, '').trim();
        const match = cleanStr.match(/(\d+(\.\d+)?)/);
        return match && match[0] ? parseFloat(match[0]) : 0;
    };

    // 1. Find Header Row (Look for "Component" or "Scheme")
    const headerIdx = data.findIndex(row => {
        if (!row || !Array.isArray(row)) return false;
        return row.some(cell => String(cell || "").toLowerCase().includes("component"));
    });

    if (headerIdx === -1) return null;
    const headers = data[headerIdx] || [];

    // 2. Map Key Columns
    let schemeCol = headers.findIndex(h => String(h || "").toLowerCase().includes("scheme"));
    let compCol = headers.findIndex(h => String(h || "").toLowerCase().includes("component"));
    let targetCol = headers.findIndex(h => String(h || "").toLowerCase().includes("target"));
    let officerCol = headers.findIndex(h => String(h || "").toLowerCase().includes("officer"));

    // Fallbacks if exact headers aren't found
    if (schemeCol === -1) schemeCol = 0;
    if (compCol === -1) compCol = 1;
    if (targetCol === -1) targetCol = 2;

    // 3. Find all "Achievement/Month" columns (everything between Target and Officer)
    const endCol = officerCol !== -1 ? officerCol : headers.length;
    const monthCols = [];
    for(let i = targetCol + 1; i < endCol; i++) {
        if (headers[i] && String(headers[i]).trim() !== "") {
            monthCols.push(i);
        }
    }

    // 4. Process Rows (Handling missing "Scheme" names from merged Excel cells)
    const tableRows = [];
    let currentScheme = "General Schemes";
    let totalTarget = 0;
    let totalAchieved = 0;

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        // Auto-fill down the Scheme name if it's blank (mimicking Excel merged cells)
        const schemeVal = String(row[schemeCol] || "").trim();
        if (schemeVal && schemeVal !== "") {
            currentScheme = schemeVal;
        }

        const compName = String(row[compCol] || "").trim();
        if (!compName || compName.toLowerCase().includes("total")) continue;

        const target = extractNumber(row[targetCol]);
        
        // Sum up all the monthly achievement columns
        let achieved = 0;
        monthCols.forEach(colIdx => {
            achieved += extractNumber(row[colIdx]);
        });

        // Only include if there is some valid data
        if (target > 0 || achieved > 0) {
            tableRows.push({
                scheme: currentScheme,
                component: compName,
                shortComp: compName.length > 25 ? compName.substring(0, 25) + "..." : compName,
                target: target,
                achieved: achieved,
                progressPct: target > 0 ? ((achieved / target) * 100) : 0,
                officer: officerCol !== -1 ? String(row[officerCol] || "").trim() : "N/A",
                rawRow: row
            });
            
            totalTarget += target;
            totalAchieved += achieved;
        }
    }

    // Sort for Charts (Top 15 by Target) to avoid visual clutter
    const chartData = [...tableRows].sort((a, b) => b.target - a.target).slice(0, 15);
    const filteredRows = tableRows.filter(r => 
        r.component.toLowerCase().includes((searchQuery || "").toLowerCase()) || 
        r.scheme.toLowerCase().includes((searchQuery || "").toLowerCase())
    );

    return { 
        headers, tableRows, chartData, filteredRows, 
        totalTarget, totalAchieved, totalSchemes: new Set(tableRows.map(r => r.scheme)).size,
        compCol, targetCol, monthCols 
    };
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
              <p className="text-sm text-gray-500 mt-1">Targets & Achievements for {activeTab.name}</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 flex-wrap justify-end">
              <select 
                className="border-2 border-green-200 p-2.5 rounded-lg bg-green-50 text-green-900 outline-none focus:ring-2 focus:ring-green-600 font-bold text-sm w-64 shadow-sm"
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
                className="bg-white border-2 border-green-600 text-green-600 px-4 py-2.5 rounded-lg shadow-sm hover:bg-green-50 transition-all font-bold text-sm flex items-center gap-2"
              >
                📝 Edit in Excel
              </a>
              <button onClick={fetchData} className="bg-green-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2">
                ↻ Sync Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-green-600">Loading Agriculture Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics && analytics.tableRows.length > 0 ? (
            
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Active Schemes/Programs" value={analytics.totalSchemes} color="text-gray-700" />
                <MetricCard title="Total Assigned Target" value={analytics.totalTarget.toLocaleString(undefined, {maximumFractionDigits: 0})} color="text-blue-600" />
                <MetricCard title="Total Volume Achieved" value={analytics.totalAchieved.toLocaleString(undefined, {maximumFractionDigits: 0})} color="text-green-600" />
                <MetricCard 
                    title="Overall Completion Rate" 
                    value={`${analytics.totalTarget > 0 ? ((analytics.totalAchieved / analytics.totalTarget) * 100).toFixed(1) : 0}%`} 
                    color="text-orange-500" 
                />
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Target vs Achievement */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Target vs Achievement (Top 15 Components)</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortComp" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Bar dataKey="target" name="Annual Target" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="achieved" name="Total Achieved" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Completion Percentage */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Component Completion Rate (%)</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortComp" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="progressPct" name="Completion %" radius={[4, 4, 0, 0]}>
                           {analytics.chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.progressPct >= 100 ? '#10b981' : entry.progressPct >= 50 ? '#3b82f6' : '#ef4444'} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Complete Scheme Records</h2>
                  <input type="text" placeholder={`Search Schemes or Components...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-green-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Scheme</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Component</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Annual Target</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Total Achieved</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Progress %</th>
                        <th className="px-4 py-3 font-bold text-center">Officer Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 border-r border-gray-100 bg-gray-50/50">
                             {row.scheme}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.component}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">
                             {row.target > 0 ? row.target.toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600 border-r border-gray-100">
                             {row.achieved > 0 ? row.achieved.toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-gray-100">
                             <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.progressPct >= 100 ? 'bg-green-100 text-green-700' : row.progressPct > 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {row.progressPct.toFixed(1)}%
                             </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                             {row.officer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center h-64 text-lg font-bold text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
               No parsable numeric data found. Ensure standard column headers.
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
      <p className={`text-3xl font-extrabold mt-2 truncate ${color.startsWith('text-[#') ? '' : color}`} style={colorHex !== '#3b82f6' ? { color: colorHex } : {}}>{value || 0}</p>
    </div>
  );
}

export default AgricultureDashboard;