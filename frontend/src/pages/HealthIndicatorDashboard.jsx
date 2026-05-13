import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Health Indicators Dashboard";

// 🛑 1. PASTE YOUR GOOGLE SHEET ID HERE 🛑
// (Upload the CSV you provided to Google Sheets and grab the ID)
const SHEET_ID = "1jIiBxpLK-_rX2_KJ7K7NYAMq2RxWU_ULSzWEe8HbUq4"; 

const TABS = [
  { name: "Maternal Death Report", gid: "0" } // Update GID if needed
];

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];
// =========================================================================

function HealthIndicatorDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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
  // HEALTH INDICATOR ENGINE
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const extractNumber = (val) => {
        if (!val) return 0;
        const cleanStr = String(val).replace(/,/g, '').trim();
        const match = cleanStr.match(/(\d+(\.\d+)?)/);
        return match && match[0] ? parseFloat(match[0]) : 0;
    };

    // 1. Find Header Row (Looking for "Month" and "Death")
    const headerIdx = data.findIndex(row => {
        if (!row || !Array.isArray(row)) return false;
        const rowStr = row.join(" ").toLowerCase();
        return rowStr.includes("month") && rowStr.includes("death");
    });

    if (headerIdx === -1) return null;
    const headers = data[headerIdx].map(h => String(h || "").trim());

    // 2. Map Key Columns
    let monthColIdx = headers.findIndex(h => h.toLowerCase().includes("month"));
    let deathColIdx = headers.findIndex(h => h.toLowerCase().includes("death"));

    if (monthColIdx === -1) monthColIdx = 1;
    if (deathColIdx === -1) deathColIdx = 2;

    const tableRows = [];
    const chartData = [];
    const topMetrics = { totalDeaths: 0, maxMonth: "-", maxDeaths: 0, minMonth: "-", minDeaths: 9999, count: 0 };

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) continue;

        const monthName = String(row[monthColIdx] || "").trim();
        
        // Skip empty rows and "Total Death" summary rows
        if (monthName && !monthName.toLowerCase().includes("total")) {
            const deaths = extractNumber(row[deathColIdx]);

            tableRows.push({
                month: monthName,
                deaths: deaths,
                rawRow: row
            });
            
            chartData.push({ name: monthName, deaths: deaths });

            topMetrics.totalDeaths += deaths;
            topMetrics.count += 1;

            if (deaths > topMetrics.maxDeaths) {
                topMetrics.maxDeaths = deaths;
                topMetrics.maxMonth = monthName;
            }
            if (deaths < topMetrics.minDeaths) {
                topMetrics.minDeaths = deaths;
                topMetrics.minMonth = monthName;
            }
        }
    }

    if (tableRows.length === 0) return null;

    return { 
        headers, tableRows, chartData, topMetrics, monthColIdx, deathColIdx 
    };
  }, [data]);

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
              <p className="text-sm text-gray-500 mt-1">Monthly Maternal Mortality Tracking</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 flex-wrap justify-end">
              <select 
                className="border-2 border-red-200 p-2.5 rounded-lg bg-red-50 text-red-900 outline-none focus:ring-2 focus:ring-red-600 font-bold text-sm w-64 shadow-sm"
                value={activeTab.name} 
                onChange={(e) => {
                  setActiveTab(TABS.find(t => t.name === e.target.value));
                }}
              >
                {TABS.map(tab => <option key={tab.name} value={tab.name}>{tab.name}</option>)}
              </select>

              <a 
                href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${activeTab.gid}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white border-2 border-red-600 text-red-600 px-4 py-2.5 rounded-lg shadow-sm hover:bg-red-50 transition-all font-bold text-sm flex items-center gap-2"
              >
                📝 Edit in Excel
              </a>
              <button onClick={fetchData} className="bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-red-700 transition font-semibold text-sm flex items-center gap-2">
                ↻ Sync Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-red-600">Loading Health Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics ? (
            
            <>
              {/* Dynamic Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                  title="Total Maternal Deaths" 
                  value={analytics.topMetrics.totalDeaths} 
                  color="text-red-600" 
                  subtitle={`Over ${analytics.topMetrics.count} months`} 
                />
                <MetricCard 
                  title="Highest Mortality Month" 
                  value={analytics.topMetrics.maxMonth} 
                  color="text-orange-500" 
                  subtitle={`${analytics.topMetrics.maxDeaths} cases recorded`} 
                />
                <MetricCard 
                  title="Lowest Mortality Month" 
                  value={analytics.topMetrics.minMonth} 
                  color="text-green-600" 
                  subtitle={`${analytics.topMetrics.minDeaths} cases recorded`} 
                />
                <MetricCard 
                  title="Average Monthly Deaths" 
                  value={(analytics.topMetrics.totalDeaths / analytics.topMetrics.count).toFixed(1)} 
                  color="text-blue-600" 
                />
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Month-wise Trend Line */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Maternal Death Trend (Month-wise)</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Line type="monotone" dataKey="deaths" name="Maternal Deaths" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Severity Bar Chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Severity Breakdown by Month</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="deaths" name="Deaths" radius={[4, 4, 0, 0]}>
                           {analytics.chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.deaths >= 5 ? '#ef4444' : entry.deaths >= 3 ? '#f59e0b' : '#3b82f6'} />
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
                  <h2 className="text-lg font-bold text-gray-800">Complete Records</h2>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Month</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Number of Maternal Deaths</th>
                        <th className="px-4 py-3 font-bold text-center">Severity Indicator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.tableRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.month}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-800 font-bold border-r border-gray-100">
                             {row.deaths}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.deaths >= 5 ? 'bg-red-100 text-red-700' : row.deaths >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {row.deaths >= 5 ? 'High Risk' : row.deaths >= 3 ? 'Moderate' : 'Normal'}
                            </span>
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
               We couldn't structure this sheet. Ensure row 2 contains the header columns.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, subtitle }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 truncate ${color}`}>{value || 0}</p>
      {subtitle && <span className="text-[10px] text-gray-400 mt-1">{subtitle}</span>}
    </div>
  );
}

export default HealthIndicatorDashboard;