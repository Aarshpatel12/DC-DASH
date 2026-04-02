import React, { useState, useEffect, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';

// 1. YOUR SINGLE GOOGLE SHEET ID
const SHEET_ID = "14IywLIjJkONz1Wxw0wzCYgrm-6LkIo8VndAM8sMQuAg";
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8ZJ9Wtxskt1AFc8qcCQivJbgcNuXIkSNWo2WOjyYJxD-VsZOxbnBmkD3ZUlyT6oKQ/exec";

// 2. THE GIDs FOR YOUR 5 TABS
const TABS = [
  { name: "Enrollment Gender Wise", gid: "0" }, 
  { name: "DropOUT", gid: "1567473018" }, 
  // { name: "GER Secndry 24-25+ Open School", gid: "669745900" }, 
  // { name: "GER-NER Pry - UP 24-25 All Age", gid: "1531608685" }, 
  // { name: "Transition Rate", gid: "1531971891" } 
];

function EducationDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Filters
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Fetch data from Google Sheets
  const fetchData = () => {
    setLoading(true);
    setErrorMsg("");
    
    // Using export?format=csv to ensure Google fetches exact numbers
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${activeTab.gid}&t=${Date.now()}`;
    
    Papa.parse(url, {
      download: true,
      header: true, 
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0 && Object.keys(results.data[0])[0].includes("<!DOCTYPE")) {
           setErrorMsg("Permission Denied: Please set the Google Sheet to 'Anyone with the link'.");
           setData([]);
        } else {
           setData(results.data);
        }
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Failed to load data. Check your internet connection.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ==============================================================
  // PROCESS 1: ENROLLMENT TAB
  // ==============================================================
  const { metrics, classChartData, filteredTableData, uniqueBlocks } = useMemo(() => {
    if (activeTab.name !== "Enrollment Gender Wise" || !data || data.length === 0) 
        return { metrics: {}, classChartData: [], filteredTableData: [], uniqueBlocks: [] };

    let total24 = 0, total25 = 0, boys25 = 0, girls25 = 0;
    const blocksSet = new Set();
    
    const classStats = {
      "Nur": { name: "Nursery", y24: 0, y25: 0 }, "LKG": { name: "LKG", y24: 0, y25: 0 },
      "UKG": { name: "UKG", y24: 0, y25: 0 }, "1st": { name: "1st", y24: 0, y25: 0 },
      "2nd": { name: "2nd", y24: 0, y25: 0 }, "3rd": { name: "3rd", y24: 0, y25: 0 },
      "4th": { name: "4th", y24: 0, y25: 0 }, "5th": { name: "5th", y24: 0, y25: 0 },
      "6th": { name: "6th", y24: 0, y25: 0 }, "7th": { name: "7th", y24: 0, y25: 0 },
      "8th": { name: "8th", y24: 0, y25: 0 }, "9th": { name: "9th", y24: 0, y25: 0 },
      "10th": { name: "10th", y24: 0, y25: 0 }, "11th": { name: "11th", y24: 0, y25: 0 },
      "12th": { name: "12th", y24: 0, y25: 0 }
    };

    const filtered = data.filter(row => {
      if (!row["School_Name"]) return false;
      blocksSet.add(row["Block Name"]);
      const matchBlock = selectedBlock === "All" || row["Block Name"] === selectedBlock;
      const matchSearch = row["School_Name"]?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBlock && matchSearch;
    });

    filtered.forEach(row => {
      total24 += parseInt(row["Total Enrollment 2024-25"] || 0);
      total25 += parseInt(row["Total Enrollment 2025-26"] || 0);
      boys25 += parseInt(row["Total Boys 25-26"] || 0);
      girls25 += parseInt(row["Total Girls 25-26"] || 0);

      Object.keys(classStats).forEach(cls => {
        classStats[cls].y24 += parseInt(row[`${cls}(B) 24-25`] || 0) + parseInt(row[`${cls}(G) 24-25`] || row[`${cls}(G)24-25`] || 0);
        classStats[cls].y25 += parseInt(row[`${cls}(B) 25-26`] || 0) + parseInt(row[`${cls}(G) 25-26`] || row[`${cls}(G)25-26`] || 0);
      });
    });

    return {
      metrics: { total24, total25, boys25, girls25, netDiff: total25 - total24 },
      classChartData: Object.values(classStats),
      filteredTableData: filtered,
      uniqueBlocks: Array.from(blocksSet).sort()
    };
  }, [data, selectedBlock, searchQuery, activeTab]);

  // ==============================================================
  // PROCESS 2: DROPOUT TAB PREDICTIONS & ANALYTICS
  // ==============================================================
  const dropOutAnalytics = useMemo(() => {
    if (activeTab.name !== "DropOUT" || !data || data.length === 0) return null;
    
    // Locate the Dropout numbers row safely
    const targetRow = data.find(r => String(r["Formula"] || r["Unnamed: 0"]).includes("Dropout"));
    if (!targetRow) return null;

    const classWise = [];
    const classes = [
      { num: "1", b: "1", g: "Unnamed: 4" }, { num: "2", b: "2", g: "Unnamed: 6" },
      { num: "3", b: "3", g: "Unnamed: 8" }, { num: "4", b: "4", g: "Unnamed: 10" },
      { num: "5", b: "5", g: "Unnamed: 12" }, { num: "6", b: "6", g: "Unnamed: 14" },
      { num: "7", b: "7", g: "Unnamed: 16" }, { num: "8", b: "8", g: "Unnamed: 18" },
      { num: "9", b: "9", g: "Unnamed: 20" }, { num: "10", b: "10", g: "Unnamed: 22" },
      { num: "11", b: "11", g: "Unnamed: 24" }, { num: "12", b: "12", g: "Unnamed: 26" }
    ];

    let maxClass = "N/A", maxVal = 0, sumBoys = 0, sumGirls = 0, count = 0;

    classes.forEach(cls => {
        const b = parseFloat(targetRow[cls.b]);
        const g = parseFloat(targetRow[cls.g]);
        
        if (!isNaN(b) || !isNaN(g)) {
            const bVal = !isNaN(b) ? Number(b.toFixed(2)) : 0;
            const gVal = !isNaN(g) ? Number(g.toFixed(2)) : 0;
            const avg = Number(((bVal + gVal) / 2).toFixed(2));
            
            classWise.push({ name: `Class ${cls.num}`, Boys: bVal, Girls: gVal, Overall: avg });

            if (avg > maxVal) { maxVal = avg; maxClass = `Class ${cls.num}`; }
            sumBoys += bVal; sumGirls += gVal; count++;
        }
    });

    const phaseWise = [];
    const phases = [
      { name: "Primary", b: "Primary", g: "Unnamed: 28", t: "Unnamed: 29" },
      { name: "Upper Primary", b: "Upper Primary", g: "Unnamed: 31", t: "Unnamed: 32" },
      { name: "Secondary", b: "Secondary", g: "Unnamed: 34", t: "Unnamed: 35" },
      { name: "Hr. Secondary", b: "Hr. Secondary", g: "Unnamed: 37", t: "Unnamed: 38" }
    ];

    phases.forEach(ph => {
        const t = parseFloat(targetRow[ph.t]);
        if (!isNaN(t)) {
            phaseWise.push({
                name: ph.name,
                Boys: Number(parseFloat(targetRow[ph.b] || 0).toFixed(2)),
                Girls: Number(parseFloat(targetRow[ph.g] || 0).toFixed(2)),
                Total: Number(t.toFixed(2))
            });
        }
    });

    const secTotal = phaseWise.find(p => p.name === "Secondary")?.Total || 0;

    return { 
        classWise, phaseWise, 
        kpis: {
           highestClass: maxClass, highestVal: maxVal,
           avgBoys: count > 0 ? (sumBoys / count).toFixed(2) : 0,
           avgGirls: count > 0 ? (sumGirls / count).toFixed(2) : 0,
           secondaryTotal: secTotal
        }
    };
  }, [data, activeTab]);

  // ==============================================================
  // PROCESS 3: DYNAMIC FALLBACK ENGINE (For GER/Transition Tabs)
  // ==============================================================
  const dynamicData = useMemo(() => {
    if (activeTab.name === "Enrollment Gender Wise" || activeTab.name === "DropOUT" || !data || data.length === 0) return null;
    
    const headers = Object.keys(data[0]).filter(k => k && !k.startsWith("_") && !k.includes("Unnamed"));
    if (headers.length < 2) return null;

    const labelKey = headers[0]; 
    const chartKeys = headers.slice(1, 3); 
    const cleanData = data.filter(row => row[labelKey] && row[labelKey].trim() !== "");

    return { headers, labelKey, chartKeys, cleanData };
  }, [data, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <ProfileNavbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar isOpen={isOpen} />
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto min-w-0">
          
          {/* Header & Global Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Education Department Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Enrollment Comparison & Transition Analysis</p>
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

              {activeTab.name === "Enrollment Gender Wise" && (
                <select 
                  className="border border-gray-300 p-2.5 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm w-48"
                  value={selectedBlock} 
                  onChange={(e) => setSelectedBlock(e.target.value)}
                >
                  <option value="All">All Blocks</option>
                  {uniqueBlocks.map(block => <option key={block} value={block}>{block}</option>)}
                </select>
              )}

              <a 
                href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${activeTab.gid}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-lg shadow-sm hover:bg-blue-50 transition-all font-bold text-sm flex items-center gap-2"
                title="Open the real Excel sheet in a new tab"
              >
                📝 Edit in Excel
              </a>
              <button onClick={fetchData} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition font-semibold text-sm flex items-center gap-2">
                ↻ Sync Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-xl font-bold text-blue-600">Loading Live Education Data...</div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-lg font-bold border border-red-200 text-center">⚠️ {errorMsg}</div>
          ) : activeTab.name === "Enrollment Gender Wise" ? (
            
            /* ========================================================= */
            /* VIEW 1: ENROLLMENT GENDER WISE                            */
            /* ========================================================= */
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Enrollment (24-25)" value={metrics.total24?.toLocaleString()} color="text-gray-700" />
                <MetricCard title="Enrollment (25-26)" value={metrics.total25?.toLocaleString()} color="text-blue-700" />
                <MetricCard title="Net Student Growth" value={metrics.netDiff > 0 ? `+${metrics.netDiff?.toLocaleString()}` : metrics.netDiff?.toLocaleString()} color={metrics.netDiff >= 0 ? "text-green-600" : "text-red-600"} isHighlight={true} />
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Current Gender Split</h3>
                  <div className="flex justify-between items-end mt-2 px-2">
                    <div className="text-center"><span className="block text-2xl font-extrabold text-blue-500">{metrics.boys25?.toLocaleString()}</span><span className="text-[10px] font-bold text-gray-400">BOYS</span></div>
                    <div className="text-center"><span className="block text-2xl font-extrabold text-pink-500">{metrics.girls25?.toLocaleString()}</span><span className="text-[10px] font-bold text-gray-400">GIRLS</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Class-wise Registrations: YoY Comparison</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Bar dataKey="y24" name="Academic Year 2024-25" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="y25" name="Academic Year 2025-26" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Student Progression / Retention Trend (25-26)</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={classChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Line type="monotone" dataKey="y25" name="Total Enrolled Students" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-bold text-gray-800">School-wise Enrollment Summary</h2>
                  <input type="text" placeholder="Search School Name..." className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold">School Name</th>
                        <th className="px-4 py-3 font-bold">Block</th>
                        <th className="px-4 py-3 font-bold text-center">Total (24-25)</th>
                        <th className="px-4 py-3 font-bold text-center">Total (25-26)</th>
                        <th className="px-4 py-3 font-bold text-center">Net Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableData.map((row, idx) => {
                        const diff = parseInt(row["Total Overall Diff"] || 0);
                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-800">{row["School_Name"]}</td>
                            <td className="px-4 py-3 text-gray-600">{row["Block Name"]}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{row["Total Enrollment 2024-25"]}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-600">{row["Total Enrollment 2025-26"]}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${diff > 0 ? 'bg-green-100 text-green-700' : diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{diff > 0 ? `+${diff}` : diff}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

          ) : activeTab.name === "DropOUT" && dropOutAnalytics ? (

            /* ========================================================= */
            /* VIEW 2: DROPOUT ANALYTICS & PREDICTIONS                   */
            /* ========================================================= */
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Highest Dropout Vulnerability" value={`${dropOutAnalytics.kpis.highestClass}`} color="text-red-600" isHighlight={true} />
                <MetricCard title="Secondary Dropout Rate" value={`${dropOutAnalytics.kpis.secondaryTotal}%`} color="text-orange-600" />
                <MetricCard title="Avg. Boys Dropout" value={`${dropOutAnalytics.kpis.avgBoys}%`} color="text-blue-600" />
                <MetricCard title="Avg. Girls Dropout" value={`${dropOutAnalytics.kpis.avgGirls}%`} color="text-pink-600" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Class-wise Dropout Prediction Risk (%)</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dropOutAnalytics.classWise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Bar dataKey="Boys" name="Boys Dropout %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Girls" name="Girls Dropout %" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Educational Phase Dropout Leakage</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dropOutAnalytics.phaseWise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Line type="monotone" dataKey="Total" name="Overall Phase Dropout %" stroke="#ef4444" strokeWidth={4} dot={{r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Dropout Vulnerability Matrix</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-red-50 text-red-800 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-bold">Education Level</th>
                        <th className="px-4 py-3 font-bold text-center">Boys Dropout Rate</th>
                        <th className="px-4 py-3 font-bold text-center">Girls Dropout Rate</th>
                        <th className="px-4 py-3 font-bold text-center">Overall Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dropOutAnalytics.classWise.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800">{row.name}</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-medium">{row.Boys}%</td>
                          <td className="px-4 py-3 text-center text-pink-600 font-medium">{row.Girls}%</td>
                          <td className="px-4 py-3 text-center">
                             <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.Overall > 7 ? 'bg-red-100 text-red-700' : row.Overall > 4 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{row.Overall}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

          ) : dynamicData ? (

            /* ========================================================= */
            /* VIEW 3: DYNAMIC ANALYTICS ENGINE (For remaining Tabs)     */
            /* ========================================================= */
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{dynamicData.chartKeys[0]} Comparison</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dynamicData.cleanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey={dynamicData.labelKey} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        {dynamicData.chartKeys.map((key, i) => (
                           <Bar key={key} dataKey={key} name={key} fill={i === 0 ? "#3b82f6" : "#f59e0b"} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{dynamicData.chartKeys[1] || dynamicData.chartKeys[0]} Trend</h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dynamicData.cleanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey={dynamicData.labelKey} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Line type="monotone" dataKey={dynamicData.chartKeys[1] || dynamicData.chartKeys[0]} name={dynamicData.chartKeys[1] || dynamicData.chartKeys[0]} stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{activeTab.name} Data Table</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
                  <table className="w-max min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {dynamicData.headers.map((header, i) => (
                          <th key={i} className="px-4 py-3 font-bold border-r border-gray-200 last:border-r-0">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dynamicData.cleanData.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          {dynamicData.headers.map((header, cIdx) => (
                             <td key={cIdx} className={`px-4 py-3 border-r border-gray-100 last:border-r-0 ${cIdx === 0 ? 'font-semibold text-gray-800 sticky left-0 bg-white z-0' : 'text-gray-600'}`}>
                               {row[header]}
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
                No chartable data found for this tab. Please ensure Row 1 contains column headers.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, isHighlight }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${isHighlight ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} flex flex-col justify-center`}>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <p className={`text-3xl font-extrabold mt-2 ${color}`}>{value || 0}</p>
    </div>
  );
}

export default EducationDashboard;