import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "RSETI Training Dashboard";

// 🛑 1. PASTE YOUR RSETI GOOGLE SHEET ID HERE 🛑
// (Upload the CSV you provided to Google Sheets and grab the ID)
const SHEET_ID = "1Msf90xmsEcC9UY1bIl5WPOyNRMn6hHYppZ5TV-BRGnQ"; 

const TABS = [
  { name: "Training Program Report", gid: "0" } // Update GID if needed
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
// =========================================================================

function RsetiDashboard() {
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
  // RSETI ENGINE (Groups recurring programs & calculates totals)
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const extractNumber = (val) => {
        if (!val) return 0;
        const cleanStr = String(val).replace(/,/g, '').trim();
        const match = cleanStr.match(/(\d+(\.\d+)?)/);
        return match && match[0] ? parseFloat(match[0]) : 0;
    };

    // 1. Find Header Row (Looking for "Name of the Programme")
    const headerIdx = data.findIndex(row => {
        if (!row || !Array.isArray(row)) return false;
        return row.some(cell => String(cell || "").toLowerCase().includes("name of the programme"));
    });

    if (headerIdx === -1) return null;
    const headers = data[headerIdx].map(h => String(h || "").trim());

    // 2. Map Key Columns
    let nameColIdx = headers.findIndex(h => h.toLowerCase().includes("programme") || h.toLowerCase().includes("program"));
    let startColIdx = headers.findIndex(h => h.toLowerCase().includes("start"));
    let endColIdx = headers.findIndex(h => h.toLowerCase().includes("end"));
    let daysColIdx = headers.findIndex(h => h.toLowerCase().includes("days"));
    let traineeColIdx = headers.findIndex(h => h.toLowerCase().includes("trainee"));

    // Fallbacks
    if (nameColIdx === -1) nameColIdx = 1;
    if (daysColIdx === -1) daysColIdx = 4;
    if (traineeColIdx === -1) traineeColIdx = 5;

    const tableRows = [];
    const groupedPrograms = {};
    const topMetrics = { totalBatches: 0, totalTrainees: 0, totalDays: 0, uniquePrograms: 0 };

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        const rawName = String(row[nameColIdx] || "").trim();
        
        if (rawName && !rawLabelIsTotal(rawName)) {
            const days = extractNumber(row[daysColIdx]);
            const trainees = extractNumber(row[traineeColIdx]);

            // Add to Raw Table Rows
            tableRows.push({
                name: rawName,
                start: startColIdx > -1 ? String(row[startColIdx]).trim() : "-",
                end: endColIdx > -1 ? String(row[endColIdx]).trim() : "-",
                days: days,
                trainees: trainees,
                rawRow: row
            });
            
            // Group data for charts (Merge recurring programs like "General EDP")
            if (!groupedPrograms[rawName]) {
                groupedPrograms[rawName] = { 
                    name: rawName, 
                    shortName: rawName.length > 20 ? rawName.substring(0, 20) + "..." : rawName,
                    totalTrainees: 0, 
                    totalDays: 0, 
                    batchCount: 0 
                };
                topMetrics.uniquePrograms += 1;
            }
            
            groupedPrograms[rawName].totalTrainees += trainees;
            groupedPrograms[rawName].totalDays += days;
            groupedPrograms[rawName].batchCount += 1;

            // Global Metrics
            topMetrics.totalBatches += 1;
            topMetrics.totalTrainees += trainees;
            topMetrics.totalDays += days;
        }
    }

    if (tableRows.length === 0) return null;

    // Sort grouped data for charts (Top 12 by Total Trainees)
    const chartData = Object.values(groupedPrograms)
        .sort((a, b) => b.totalTrainees - a.totalTrainees)
        .slice(0, 12);
    
    const filteredRows = tableRows.filter(r => r.name.toLowerCase().includes((searchQuery || "").toLowerCase()));

    function rawLabelIsTotal(str) {
        return str.toLowerCase() === "total" || str.toLowerCase() === "grand total";
    }

    return { 
        headers, tableRows, chartData, filteredRows, topMetrics, 
        nameColIdx, startColIdx, endColIdx, daysColIdx, traineeColIdx 
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
              <p className="text-sm text-gray-500 mt-1">Skill Development & Training Analytics</p>
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
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading RSETI Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics ? (
            
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Batches Conducted" value={analytics.topMetrics.totalBatches.toLocaleString()} color="text-gray-700" />
                <MetricCard title="Total Trainees Trained" value={analytics.topMetrics.totalTrainees.toLocaleString()} color="text-blue-600" />
                <MetricCard title="Unique Skill Programs" value={analytics.topMetrics.uniquePrograms.toLocaleString()} color="text-purple-600" />
                <MetricCard title="Total Training Days" value={analytics.topMetrics.totalDays.toLocaleString()} color="text-green-600" />
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Trainees by Program Type */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Top Programs by Total Trainees</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortName" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Bar dataKey="totalTrainees" name="Total Trainees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Batches Run per Program */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Number of Batches per Program</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortName" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Bar dataKey="batchCount" name="Batches Conducted" fill="#10b981" radius={[4, 4, 0, 0]}>
                           {analytics.chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <h2 className="text-lg font-bold text-gray-800">Complete Training Batch Records</h2>
                  <input type="text" placeholder={`Search Programme Name...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[500px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Programme Name</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Start Date</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">End Date</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Duration (Days)</th>
                        <th className="px-4 py-3 font-bold text-center">Total Trainees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.name}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{row.start}</td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{row.end}</td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{row.days > 0 ? row.days : "-"}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{row.trainees > 0 ? row.trainees : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
             <div className="flex justify-center items-center h-64 text-lg font-bold text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
               We couldn't structure this sheet. Ensure row 2 contains the header columns.
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
      <p className={`text-3xl font-extrabold mt-2 truncate ${color}`}>{value || 0}</p>
    </div>
  );
}

export default RsetiDashboard;