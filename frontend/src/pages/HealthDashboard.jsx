import React, { useState, useMemo } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line, Cell
} from 'recharts';

// =========================================================================
const DASHBOARD_TITLE = "Health Department Dashboard";

// --- HARDCODED DATA FROM PDF REPORTS ---
const ABMMSBY_DATA = [
  { month: "May 2025", cards: 6679, ipd: 2230 },
  { month: "Jun 2025", cards: 5996, ipd: 1631 },
  { month: "Jul 2025", cards: 6432, ipd: 2504 },
  { month: "Aug 2025", cards: 4858, ipd: 2490 },
  { month: "Sep 2025", cards: 3648, ipd: 2810 },
  { month: "Oct 2025", cards: 3168, ipd: 1483 },
  { month: "Nov 2025", cards: 3630, ipd: 2058 },
  { month: "Dec 2025", cards: 3683, ipd: 2433 },
  { month: "Jan 2026", cards: 7904, ipd: 2244 },
  { month: "Feb 2026", cards: 78708, ipd: 2339 },
  { month: "Mar 2026", cards: 110064, ipd: 2544 },
];

const PHSC_DATA = [
  { project: "Addition of 100 beds in MCH Building DH Ludhiana", shortName: "100 Beds MCH DH", amount: 134023000, progress: 90, status: "Work in Progress" },
  { project: "Fire fighting system at CHC Sahnewal", shortName: "Fire Sys Sahnewal", amount: 6215014, progress: 70, status: "Work in Progress" },
  { project: "Construction of 4 bedded ICU at DH Ludhiana", shortName: "4 Bed ICU DH", amount: 2334808, progress: 90, status: "Stopped (Funds)" },
  { project: "Fire fighting system at CHC Payal", shortName: "Fire Sys Payal", amount: 5819408, progress: 100, status: "Completed & Handed Over" },
  { project: "Painting/Lighting Repair in SDH Khanna", shortName: "Repair SDH Khanna", amount: 2447280, progress: 100, status: "Completed" },
  { project: "Painting/Lighting Repair in SDH Samrala", shortName: "Repair SDH Samrala", amount: 1439450, progress: 100, status: "Completed" },
  { project: "Painting/Lighting Repair in SDH Raikot", shortName: "Repair SDH Raikot", amount: 857120, progress: 100, status: "Completed" },
  { project: "Painting/Lighting Repair in SDH Jagraon", shortName: "Repair SDH Jagraon", amount: 2289281, progress: 100, status: "Completed" },
];

const TABS = ["ABMMSBY Scheme", "PHSC Infrastructure"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
// =========================================================================

function HealthDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsOpen(!isOpen);

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    if (activeTab === "ABMMSBY Scheme") {
      const filtered = ABMMSBY_DATA.filter(d => d.month.toLowerCase().includes(searchQuery.toLowerCase()));
      const totalCards = ABMMSBY_DATA.reduce((sum, d) => sum + d.cards, 0);
      const totalIPD = ABMMSBY_DATA.reduce((sum, d) => sum + d.ipd, 0);
      return { type: "scheme", data: filtered, rawData: ABMMSBY_DATA, totalCards, totalIPD, count: ABMMSBY_DATA.length };
    } else {
      const filtered = PHSC_DATA.filter(d => d.project.toLowerCase().includes(searchQuery.toLowerCase()));
      const totalFunds = PHSC_DATA.reduce((sum, d) => sum + d.amount, 0);
      const avgProgress = PHSC_DATA.reduce((sum, d) => sum + d.progress, 0) / PHSC_DATA.length;
      const completed = PHSC_DATA.filter(d => d.progress === 100).length;
      return { type: "infra", data: filtered, rawData: PHSC_DATA, totalFunds, avgProgress, completed, count: PHSC_DATA.length };
    }
  }, [activeTab, searchQuery]);

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
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === "ABMMSBY Scheme" ? "Ayushman Bharat Card & IPD Analytics" : "PHSC Hospital Construction Projects"}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 flex-wrap justify-end">
              <select 
                className="border-2 border-red-200 p-2.5 rounded-lg bg-red-50 text-red-900 outline-none focus:ring-2 focus:ring-red-600 font-bold text-sm w-64 shadow-sm"
                value={activeTab} 
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSearchQuery("");
                }}
              >
                {TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
              </select>
            </div>
          </div>

          {/* Dynamic Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.type === "scheme" ? (
              <>
                <MetricCard title="Total Months Tracked" value={analytics.count} color="text-gray-700" />
                <MetricCard title="Total Cards Generated" value={analytics.totalCards.toLocaleString()} color="text-blue-600" />
                <MetricCard title="Total IPD Treatments" value={analytics.totalIPD.toLocaleString()} color="text-green-600" />
                <MetricCard title="Avg Cards per Month" value={Math.round(analytics.totalCards / analytics.count).toLocaleString()} color="text-purple-600" />
              </>
            ) : (
              <>
                <MetricCard title="Total Infrastructure Projects" value={analytics.count} color="text-gray-700" />
                <MetricCard title="Total Funds Allotted" value={`₹${(analytics.totalFunds / 100000).toLocaleString(undefined, {maximumFractionDigits: 1})} Lakhs`} color="text-orange-600" />
                <MetricCard title="Average Physical Progress" value={`${Math.round(analytics.avgProgress)}%`} color="text-blue-600" />
                <MetricCard title="Fully Completed Projects" value={analytics.completed} color="text-green-600" />
              </>
            )}
          </div>

          {/* Graphical Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Primary Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {analytics.type === "scheme" ? "Cards Generated per Month" : "Physical Progress (%) by Project"}
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {analytics.type === "scheme" ? (
                    <BarChart data={analytics.rawData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                      <Bar dataKey="cards" name="Cards Generated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={analytics.rawData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="shortName" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                      <Bar dataKey="progress" name="Physical Progress %" radius={[4, 4, 0, 0]}>
                        {analytics.rawData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.progress >= 100 ? '#10b981' : entry.progress >= 50 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {analytics.type === "scheme" ? "IPD Patient Trend" : "Alloted Amount (₹) by Project"}
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {analytics.type === "scheme" ? (
                      <LineChart data={analytics.rawData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Line type="monotone" dataKey="ipd" name="IPD Patients" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                      </LineChart>
                  ) : (
                      <BarChart data={analytics.rawData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="shortName" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                        <Bar dataKey="amount" name="Allotted Amount (₹)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-lg font-bold text-gray-800">Complete Records</h2>
              <input type="text" placeholder={`Search records...`} className="border border-gray-300 p-2 rounded-lg w-full md:w-64 bg-gray-50 outline-none focus:ring-2 focus:ring-red-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {analytics.type === "scheme" ? (
                      <>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Month-Year</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Cards Generated</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">IPD Patients</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 font-bold border-r border-gray-200">Project Name</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Allotted Amount (₹)</th>
                        <th className="px-4 py-3 font-bold border-r border-gray-200 text-center">Physical Progress</th>
                        <th className="px-4 py-3 font-bold text-center">Remarks / Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {analytics.data.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                      {analytics.type === "scheme" ? (
                        <>
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100">{row.month}</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-bold border-r border-gray-100">{row.cards.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-bold">{row.ipd.toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-semibold text-gray-800 sticky left-0 bg-white z-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100 whitespace-pre-wrap">{row.project}</td>
                          <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">₹{row.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-100">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.progress >= 100 ? 'bg-green-100 text-green-700' : row.progress >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                              {row.progress}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs whitespace-pre-wrap">{row.status}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {analytics.data.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-400">No records found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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

export default HealthDashboard;