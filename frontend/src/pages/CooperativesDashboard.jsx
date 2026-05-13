import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Cooperative Societies & PACS Dashboard";
const SHEET_ID = "1J89FvTsEJUKJ7SnMooA5luNwP_e6pPZhLmR21QwukmM"; // <--- Put your Cooperatives Google Sheet ID here!
const TABS = [
  { name: "Tehsil Summary", gid: "0" }, 
  { name: "Cooperative Societies", gid: "1337515058" }, // <-- Update GID
  { name: "PACS Details", gid: "1975638638" } // <-- Update GID
];
// =========================================================================

function CooperativesDashboard() {
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
  // SMART ENGINE FOR COOPERATIVES (Handles 3 completely different tabs)
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Find Header Row
    const headerIdx = data.findIndex(row => 
      row.some(cell => String(cell).toLowerCase().includes("tehsil") || 
                       String(cell).toLowerCase().includes("society") || 
                       String(cell).toLowerCase().includes("pacs"))
    );
    
    if (headerIdx === -1) return null;
    const headers = data[headerIdx];
    
    // 2. Identify which tab we are looking at based on columns
    const isSummaryTab = headers.some(h => String(h).toLowerCase().includes("tehsil/block name"));
    const isSocTab = headers.some(h => String(h).toLowerCase().includes("type of cooperative"));
    const isPacsTab = headers.some(h => String(h).toLowerCase().includes("loan disbursed"));

    const parsedData = [];
    const topMetrics = { val1: 0, val2: 0, val3: 0, count: 0 };
    
    // Dynamically set up columns based on tab type
    let labelCol = 0, vCol1 = -1, vCol2 = -1, vCol3 = -1;
    let labelName = "Name", v1Name = "Val1", v2Name = "Val2", v3Name = "Val3";

    if (isSummaryTab) {
        labelCol = headers.findIndex(h => String(h).toLowerCase().includes("tehsil"));
        vCol1 = headers.findIndex(h => String(h).toLowerCase().includes("total societies"));
        vCol2 = headers.findIndex(h => String(h).toLowerCase() === "active");
        vCol3 = headers.findIndex(h => String(h).toLowerCase().includes("total pacs"));
        labelName = "Tehsil"; v1Name = "Total Societies"; v2Name = "Active Societies"; v3Name = "Total PACS";
    } else if (isSocTab) {
        labelCol = headers.findIndex(h => String(h).toLowerCase().includes("name of society"));
        vCol1 = headers.findIndex(h => String(h).toLowerCase().includes("total membership"));
        vCol2 = headers.findIndex(h => String(h).toLowerCase().includes("active members"));
        labelName = "Society"; v1Name = "Total Membership"; v2Name = "Active Members";
    } else if (isPacsTab) {
        labelCol = headers.findIndex(h => String(h).toLowerCase().includes("name of pacs"));
        vCol1 = headers.findIndex(h => String(h).toLowerCase().includes("total membership"));
        vCol2 = headers.findIndex(h => String(h).toLowerCase().includes("loan disbursed"));
        vCol3 = headers.findIndex(h => String(h).toLowerCase().includes("recovery"));
        labelName = "PACS"; v1Name = "Total Membership"; v2Name = "Loan Disbursed (Lakhs)"; v3Name = "Recovery %";
    }

    // Fallbacks if columns are shifted
    if (labelCol === -1) labelCol = 0;

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        const rawLabel = String(row[labelCol] || "").trim();
        
        if (rawLabel && !rawLabel.toLowerCase().includes("total") && rawLabel !== "") {
            
            // Clean numbers (remove commas, handle text)
            const getNum = (colIdx) => colIdx > -1 ? parseFloat(String(row[colIdx] || "0").replace(/,/g, '')) || 0 : 0;
            
            const v1 = getNum(vCol1);
            const v2 = getNum(vCol2);
            const v3 = getNum(vCol3);
            
            parsedData.push({
                name: rawLabel,
                shortName: rawLabel.substring(0, 15) + (rawLabel.length > 15 ? "..." : ""),
                v1, v2, v3,
                rawRow: row
            });

            topMetrics.val1 += v1;
            topMetrics.val2 += v2;
            topMetrics.val3 += v3;
            topMetrics.count++;
        }
    }

    // For detailed tabs with 100+ rows, we only chart the Top 15 to avoid messy charts
    const chartData = isSummaryTab ? parsedData : [...parsedData].sort((a, b) => b.v1 - a.v1).slice(0, 15);
    const filteredRows = parsedData.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return { 
      isSummaryTab, isSocTab, isPacsTab, 
      headers, parsedData, chartData, filteredRows, topMetrics, 
      labelCol, labelName, v1Name, v2Name, v3Name 
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
              <p className="text-sm text-gray-500 mt-1">Societies, Memberships & Financial Tracking</p>
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
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Cooperative Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics ? (
            
            <>
              {/* Dynamic Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.isSummaryTab && (
                  <>
                    <MetricCard title="Total Societies" value={analytics.topMetrics.val1.toLocaleString()} color="text-gray-700" />
                    <MetricCard title="Active Societies" value={analytics.topMetrics.val2.toLocaleString()} color="text-green-600" />
                    <MetricCard title="Total PACS" value={analytics.topMetrics.val3.toLocaleString()} color="text-blue-600" />
                    <MetricCard title="Total Tehsils Mapped" value={analytics.topMetrics.count} color="text-purple-600" />
                  </>
                )}
                {analytics.isSocTab && (
                  <>
                    <MetricCard title="Total Registered Societies" value={analytics.topMetrics.count.toLocaleString()} color="text-gray-700" />
                    <MetricCard title="Total Members" value={analytics.topMetrics.val1.toLocaleString()} color="text-blue-600" />
                    <MetricCard title="Active Members" value={analytics.topMetrics.val2.toLocaleString()} color="text-green-600" />
                    <MetricCard title="Member Activity Rate" value={`${((analytics.topMetrics.val2 / analytics.topMetrics.val1) * 100).toFixed(1)}%`} color="text-purple-600" />
                  </>
                )}
                {analytics.isPacsTab && (
                  <>
                    <MetricCard title="Total PACS Listed" value={analytics.topMetrics.count.toLocaleString()} color="text-gray-700" />
                    <MetricCard title="Total PACS Members" value={analytics.topMetrics.val1.toLocaleString()} color="text-blue-600" />
                    <MetricCard title="Total Loan Disbursed" value={`₹${analytics.topMetrics.val2.toLocaleString(undefined, {maximumFractionDigits: 2})}`} color="text-orange-600" />
                    <MetricCard title="Average Recovery Rate" value={`${(analytics.topMetrics.val3 / analytics.topMetrics.count * 100).toFixed(1)}%`} color="text-green-600" />
                  </>
                )}
              </div>

              {/* Dynamic Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Primary Chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {analytics.isSummaryTab ? "Societies & PACS by Tehsil" : `Top 15 ${analytics.labelName} by ${analytics.v1Name}`}
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey={analytics.isSummaryTab ? "name" : "shortName"} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                        <Bar dataKey="v1" name={analytics.v1Name} fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        {analytics.isSummaryTab && <Bar dataKey="v3" name={analytics.v3Name} fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                        {analytics.isSocTab && <Bar dataKey="v2" name={analytics.v2Name} fill="#10b981" radius={[4, 4, 0, 0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Secondary Chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {analytics.isSummaryTab ? "Active Society Comparison" : analytics.isPacsTab ? `Top 15 PACS by Loan Disbursed` : "Active Member Comparison"}
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analytics.isPacsTab ? [...analytics.parsedData].sort((a,b)=> b.v2 - a.v2).slice(0, 15) : analytics.chartData} 
                        margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey={analytics.isSummaryTab ? "name" : "shortName"} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                        <Bar dataKey="v2" name={analytics.v2Name} fill={analytics.isPacsTab ? "#f59e0b" : "#10b981"} radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                        {analytics.headers.map((h, i) => {
                          if (!h) return null;
                          return <th key={i} className="px-4 py-3 font-bold border-r border-gray-200">{h}</th>
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          {analytics.headers.map((h, cIdx) => {
                             if (!h) return null;
                             return (
                               <td key={cIdx} className={`px-4 py-3 border-r border-gray-100 ${cIdx === analytics.labelCol ? 'font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : 'text-gray-600'}`}>
                                 {row.rawRow[cIdx] || "-"}
                               </td>
                             )
                          })}
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
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider truncate" title={title}>{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 ${color} truncate`}>{value || 0}</p>
      {subtitle && <span className="text-[10px] text-gray-400 mt-1">{subtitle}</span>}
    </div>
  );
}

export default CooperativesDashboard;