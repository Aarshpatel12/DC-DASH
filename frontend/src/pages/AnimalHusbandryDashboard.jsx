import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Animal Husbandry Dashboard";
const SHEET_ID = "1OFrKcPmsGLiLppPkVu8w54_ezY41AlAnjcw2e39sldo"; 
const TABS = [
  { name: "Livestock Census", gid: "0" }, 
  { name: "Department Services", gid: "822650352" } 
];
// =========================================================================

function AnimalHusbandryDashboard() {
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
  // CUSTOM ANALYTICS ENGINE FOR ANIMAL HUSBANDRY
  // ==============================================================
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // FIXED: Now correctly skips the "Livestock Census" title row by ensuring 
    // the row has at least 2 separate text columns filled out.
    const headerIdx = data.findIndex(row => {
      const validCells = row.filter(cell => cell && String(cell).trim() !== '');
      if (validCells.length < 2) return false;
      
      const rowStr = validCells.join(" ").toLowerCase();
      return rowStr.includes("livestock") || rowStr.includes("services") || rowStr.includes("target");
    });

    if (headerIdx === -1) return null;

    const headers = data[headerIdx];
    const isCensusTab = headers.some(h => String(h).toLowerCase().includes("livestock"));

    const parsedData = [];
    const topMetrics = { total1: 0, total2: 0, metric3: 0, metric4: 0 };
    
    let labelCol = 0;
    let valCol1 = 1, valCol2 = 2, valCol3 = 3;

    // Use .toLowerCase() for rock-solid column matching
    if (isCensusTab) {
        labelCol = headers.findIndex(h => String(h).toLowerCase().includes("livestock"));
        valCol1 = headers.findIndex(h => String(h).includes("2019"));
        valCol2 = headers.findIndex(h => String(h).includes("2026"));
    } else {
        labelCol = headers.findIndex(h => String(h).toLowerCase().includes("services"));
        valCol1 = headers.findIndex(h => String(h).toLowerCase().includes("target"));
        valCol2 = headers.findIndex(h => String(h).toLowerCase().includes("progress"));
        valCol3 = headers.findIndex(h => String(h).toLowerCase().includes("achievement"));
    }

    // Safety fallback just in case column detection missed
    if (labelCol === -1) labelCol = 0;
    if (valCol1 === -1) valCol1 = 1;
    if (valCol2 === -1) valCol2 = 2;

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        const label = String(row[labelCol] || "").trim();
        
        if (label && !label.toLowerCase().includes("total")) {
            const v1 = parseFloat(String(row[valCol1] || "").replace(/,/g, '')) || 0;
            const v2 = parseFloat(String(row[valCol2] || "").replace(/,/g, '')) || 0;
            const v3 = valCol3 > -1 ? parseFloat(String(row[valCol3] || "").replace(/,/g, '')) || 0 : 0;
            
            // Skip massive poultry numbers in the charts so the other animals don't look tiny
            const isPoultry = label.toLowerCase().includes("poultry");

            parsedData.push({ 
                name: label, 
                val1: v1, 
                val2: v2, 
                val3: v3,
                isPoultry: isPoultry,
                rawRow: row
            });

            if (!isPoultry && isCensusTab) {
                topMetrics.total1 += v1;
                topMetrics.total2 += v2;
            } else if (!isCensusTab) {
                topMetrics.total1 += v1;
                topMetrics.total2 += v2;
            }
        }
    }

    const filteredRows = parsedData.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return { isCensusTab, headers, parsedData, filteredRows, topMetrics, labelCol, valCol1, valCol2, valCol3 };
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
              <p className="text-sm text-gray-500 mt-1">Livestock Tracking & Department Services</p>
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

              <button onClick={fetchData} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2">
                ↻ Sync Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Animal Husbandry Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : analytics ? (
            
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.isCensusTab ? (
                  <>
                    <MetricCard title="Total Livestock (2019)" value={analytics.topMetrics.total1.toLocaleString()} color="text-gray-700" subtitle="Excluding Poultry" />
                    <MetricCard title="Total Livestock (2026)" value={analytics.topMetrics.total2.toLocaleString()} color="text-blue-700" subtitle="Excluding Poultry" />
                    <MetricCard 
                        title="Livestock Growth/Decline" 
                        value={`${(analytics.topMetrics.total2 - analytics.topMetrics.total1) > 0 ? '+' : ''}${(analytics.topMetrics.total2 - analytics.topMetrics.total1).toLocaleString()}`} 
                        color={(analytics.topMetrics.total2 - analytics.topMetrics.total1) > 0 ? "text-green-600" : "text-red-600"} 
                    />
                    <MetricCard title="Total Poultry (2026)" value={analytics.parsedData.find(d => d.isPoultry)?.val2.toLocaleString() || 0} color="text-orange-500" />
                  </>
                ) : (
                  <>
                    <MetricCard title="Total Service Targets" value={analytics.topMetrics.total1.toLocaleString()} color="text-gray-700" />
                    <MetricCard title="Total Progress" value={analytics.topMetrics.total2.toLocaleString()} color="text-green-600" />
                    <MetricCard title="Overall Achievement Rate" value={`${((analytics.topMetrics.total2 / analytics.topMetrics.total1) * 100).toFixed(2)}%`} color="text-blue-600" />
                    <MetricCard title="Vaccines Administered" value={analytics.parsedData.filter(d => d.name.toLowerCase().includes('vaccination')).reduce((sum, d) => sum + d.val2, 0).toLocaleString()} color="text-purple-600" />
                  </>
                )}
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Chart 1: Bar Comparison */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {analytics.isCensusTab ? "Livestock Population (2019 vs 2026)" : "Targets vs Progress by Service"}
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.parsedData.filter(d => !d.isPoultry)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                        <Bar dataKey="val1" name={analytics.isCensusTab ? "2019 Population" : "Target"} fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="val2" name={analytics.isCensusTab ? "2026 Population" : "Progress"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {analytics.isCensusTab && <p className="text-xs text-center text-gray-400 mt-2">*Poultry excluded from chart due to massive scale difference.</p>}
                </div>

                {/* Chart 2: Trend / Achievement Percentage */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    {analytics.isCensusTab ? "Population Growth/Decline Trend" : "Achievement Percentage (%)"}
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {analytics.isCensusTab ? (
                         <LineChart data={analytics.parsedData.filter(d => !d.isPoultry)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                           <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                           <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                           <Line type="monotone" dataKey="val2" name="2026 Population Trend" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: '#fff'}} />
                         </LineChart>
                      ) : (
                         <BarChart data={analytics.parsedData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                           <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                           <YAxis tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                           <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                           <Bar dataKey="val3" name="Achievement %" radius={[4, 4, 0, 0]}>
                              {analytics.parsedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.val3 >= 100 ? '#10b981' : entry.val3 > 75 ? '#3b82f6' : '#ef4444'} />
                              ))}
                           </Bar>
                         </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Detailed Records</h2>
                  <input type="text" placeholder={`Search ${analytics.headers[analytics.labelCol]}...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">{analytics.headers[analytics.labelCol]}</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">{analytics.headers[analytics.valCol1]}</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">{analytics.headers[analytics.valCol2]}</th>
                        {!analytics.isCensusTab && <th className="px-4 py-3 font-bold text-center">{analytics.headers[analytics.valCol3]}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">
                             {row.name}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{row.val1.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600 border-r border-gray-100">{row.val2.toLocaleString()}</td>
                          
                          {!analytics.isCensusTab && (
                             <td className="px-4 py-3 text-center">
                               <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.val3 >= 100 ? 'bg-green-100 text-green-700' : row.val3 > 75 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                 {row.val3}%
                               </span>
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
               We couldn't structure this sheet. Ensure row 2 contains the headers.
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

export default AnimalHusbandryDashboard;