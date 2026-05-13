import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/dcDashboard/Navbar';
import SubNavbar from '../../../components/dcDashboard/SubNavbar';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

// =========================================================================
// 🛑 MASTER SHEET IDs & GIDs 🛑
// =========================================================================
const SHEETS = {
  ANIMAL_HUSBANDRY: { id: "1OFrKcPmsGLiLppPkVu8w54_ezY41AlAnjcw2e39sldo", gid: "822650352" },
  FISHERIES: { id: "1gAs-NsKzzoFKIn7MJMSyCmtceIklc1QjGHX9Ir7gREY", gid: "0" },
  MARKFED_WHEAT: { id: "1FcHso6fmDgG0Tw-GLXrk-xBk_1Tisf33mY_1XWVeSkI", gid: "1699533549" },
  // Replace "YOUR_..." with the actual Sheet IDs once you have them!
  MNREGA: { id: "18QJ7412AYcpP4L07pb3YNgVBR4o31rVzWa4EOSR1v5Y", gid: "0" }, 
  RSETI: { id: "1Msf90xmsEcC9UY1bIl5WPOyNRMn6hHYppZ5TV-BRGnQ", gid: "0" },
  AGRICULTURE: { id: "1Q7zHVgl1DLtvhJkzM7ce5_nhbLPE8BoxkNriX_Ra6xw", gid: "0" },
  COOPERATIVES: { id: "1J89FvTsEJUKJ7SnMooA5luNwP_e6pPZhLmR21QwukmM", gid: "0" },
  DAIRY: { id: "1y0XZRWgW4b9rBiFaZ3QFG3SvodtbCbfN3ttt5oVJgXI", gid: "0" }
};

// Health is hardcoded since it came from a PDF
const HEALTH_DATA = [
  { month: "Oct 25", cards: 3168, ipd: 1483 }, { month: "Nov 25", cards: 3630, ipd: 2058 },
  { month: "Dec 25", cards: 3683, ipd: 2433 }, { month: "Jan 26", cards: 7904, ipd: 2244 },
  { month: "Feb 26", cards: 78708, ipd: 2339 }, { month: "Mar 26", cards: 110064, ipd: 2544 }
];
// =========================================================================


function DcDashboardMainPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Navbar />
      <SubNavbar />
      
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6 space-y-6">
        
        {/* Page Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Deputy Commissioner's Executive Overview</h1>
            <p className="text-gray-500 mt-1">Live, high-level metrics across all district departments.</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-200 shadow-sm">
            Total Departments: 15+
          </div>
        </div>

        {/* --- MASTER GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. HEALTH WIDGET */}
          <WidgetCard title="Health (MMSBY Cards vs IPD)" color="border-t-pink-500">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HEALTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                <Area type="monotone" dataKey="cards" name="Cards Generated" stroke="#ec4899" fillOpacity={1} fill="url(#colorCards)" />
                <Line type="monotone" dataKey="ipd" name="IPD Patients" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </WidgetCard>

          {/* 2. ANIMAL HUSBANDRY WIDGET */}
          <WidgetCard title="Animal Husbandry (Targets)" color="border-t-blue-500">
            <MiniAnimalHusbandry />
          </WidgetCard>

          {/* 3. FISHERIES WIDGET */}
          <WidgetCard title="Fisheries (Monthly Progress)" color="border-t-cyan-500">
            <MiniFisheries />
          </WidgetCard>

          {/* 4. MARKFED WIDGET */}
          <WidgetCard title="Markfed (Wheat Purchase)" color="border-t-yellow-500">
            <MiniMarkfed />
          </WidgetCard>

          {/* 5. MNREGA WIDGET */}
          <WidgetCard title="MNREGA (Funds vs Expenditure)" color="border-t-green-500">
            <MiniMnrega />
          </WidgetCard>

          {/* 6. RSETI WIDGET */}
          <WidgetCard title="RSETI (Trainees by Program)" color="border-t-purple-500">
            <MiniRseti />
          </WidgetCard>

          {/* 7. AGRICULTURE WIDGET */}
          <WidgetCard title="Agriculture (Targets vs Achievement)" color="border-t-emerald-500">
            <MiniAgriculture />
          </WidgetCard>

          {/* 8. COOPERATIVES WIDGET */}
          <WidgetCard title="Cooperatives (Societies by Tehsil)" color="border-t-indigo-500">
            <MiniCooperatives />
          </WidgetCard>

          {/* 9. DAIRY WIDGET */}
          <WidgetCard title="Dairy (Training Batches)" color="border-t-orange-500">
            <MiniDairy />
          </WidgetCard>

        </div>
      </div>
    </div>
  );
}

// =========================================================================
// WIDGET UI SHELL
// =========================================================================
function WidgetCard({ title, children, color }) {
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-t-4 ${color} flex flex-col h-72 transition hover:shadow-md`}>
      <h2 className="text-[15px] font-bold text-gray-800 mb-3 truncate" title={title}>{title}</h2>
      <div className="flex-1 w-full relative">
        {children}
      </div>
    </div>
  );
}

// =========================================================================
// MINI DATA FETCHERS (These silently pull data in the background)
// =========================================================================

function MiniAnimalHusbandry() {
  const [data, setData] = useState([]);
  useEffect(() => {
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.ANIMAL_HUSBANDRY.id}/export?format=csv&gid=${SHEETS.ANIMAL_HUSBANDRY.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const hIdx = rows.findIndex(r => r.some(c => String(c).includes("Target")));
        if (hIdx === -1) return;
        
        let parsed = [];
        for (let i = hIdx + 1; i < Math.min(rows.length, hIdx + 6); i++) {
          const row = rows[i];
          if(row[0] && !row[0].toLowerCase().includes("total")) {
            parsed.push({ 
              name: row[0].substring(0, 10) + "..", 
              target: parseFloat(String(row[1]).replace(/,/g, '')) || 0,
              progress: parseFloat(String(row[2]).replace(/,/g, '')) || 0
            });
          }
        }
        setData(parsed);
      }
    });
  }, []);

  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="target" name="Target" fill="#9ca3af" radius={[3, 3, 0, 0]} />
        <Bar dataKey="progress" name="Progress" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniFisheries() {
  const [data, setData] = useState([]);
  useEffect(() => {
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.FISHERIES.id}/export?format=csv&gid=${SHEETS.FISHERIES.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const mRow = rows.findIndex(r => r.some(c => String(c).includes("ਅਪ੍ਰੈਲ") || String(c).toLowerCase().includes("april")));
        if (mRow === -1) return;
        
        const monthStartIdx = rows[mRow].findIndex(c => String(c).includes("ਅਪ੍ਰੈਲ") || String(c).toLowerCase().includes("april"));
        const months = rows[mRow].slice(monthStartIdx).map(m => String(m).replace(/,\s*\d{4}/, '').replace(/\n/g, ' ').trim());
        
        const p1 = rows[mRow+1]; const p2 = rows[mRow+2];
        if(!p1 || !p2) return;

        let parsed = months.map((m, i) => {
           const getNum = (val) => parseFloat(String(val).replace(/,/g, '').match(/(\d+(\.\d+)?)/)?.[0] || 0);
           return { month: m, item1: getNum(p1[monthStartIdx + i]), item2: getNum(p2[monthStartIdx + i]) }
        });
        setData(parsed.slice(-6)); 
      }
    });
  }, []);

  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Line type="monotone" dataKey="item1" name="Old Area" stroke="#06b6d4" strokeWidth={2} />
        <Line type="monotone" dataKey="item2" name="New Area" stroke="#f59e0b" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniMarkfed() {
  const [data, setData] = useState([]);
  useEffect(() => {
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.MARKFED_WHEAT.id}/export?format=csv&gid=${SHEETS.MARKFED_WHEAT.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        let parsed = [];
        for(let i=0; i<rows.length; i++) {
          if(rows[i][2] && String(rows[i][2]).match(/^[A-Za-z]+$/) && !String(rows[i][2]).toLowerCase().includes("total") && parseFloat(rows[i][3])) {
             parsed.push({ branch: rows[i][2], bags: parseFloat(String(rows[i][3]).replace(/,/g, '')) });
          }
          if(parsed.length >= 5) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="branch" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="bags" name="Bags" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniMnrega() {
  const [data, setData] = useState([]);
  useEffect(() => {
    if(SHEETS.MNREGA.id.includes("YOUR")) return;
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.MNREGA.id}/export?format=csv&gid=${SHEETS.MNREGA.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const hIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes("total_fund")));
        if (hIdx === -1) return;
        const fundIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("total_fund"));
        const expIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("expenditure") && !String(c).toLowerCase().includes("admin"));
        let parsed = [];
        for(let i=hIdx+1; i<rows.length; i++){
          if(rows[i][0] && !rows[i][0].toLowerCase().includes("total")){
            parsed.push({
              name: rows[i][0].substring(0,8),
              fund: parseFloat(String(rows[i][fundIdx]).replace(/,/g,'')) || 0,
              exp: parseFloat(String(rows[i][expIdx]).replace(/,/g,'')) || 0
            });
          }
          if(parsed.length >= 5) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(SHEETS.MNREGA.id.includes("YOUR")) return <div className="text-center mt-12 text-gray-400">Waiting for Sheet ID...</div>;
  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="fund" name="Fund" fill="#9ca3af" radius={[3, 3, 0, 0]} />
        <Bar dataKey="exp" name="Expenditure" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniRseti() {
  const [data, setData] = useState([]);
  useEffect(() => {
    if(SHEETS.RSETI.id.includes("YOUR")) return;
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.RSETI.id}/export?format=csv&gid=${SHEETS.RSETI.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const hIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes("programme")));
        if (hIdx === -1) return;
        const nameIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("programme"));
        const traineeIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("trainee"));
        let parsed = [];
        for(let i=hIdx+1; i<rows.length; i++){
          if(rows[i][nameIdx] && !rows[i][nameIdx].toLowerCase().includes("total")){
            parsed.push({
              name: rows[i][nameIdx].substring(0,10) + "..",
              trainees: parseFloat(String(rows[i][traineeIdx])) || 0
            });
          }
          if(parsed.length >= 5) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(SHEETS.RSETI.id.includes("YOUR")) return <div className="text-center mt-12 text-gray-400">Waiting for Sheet ID...</div>;
  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="trainees" name="Trainees" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniAgriculture() {
  const [data, setData] = useState([]);
  useEffect(() => {
    if(SHEETS.AGRICULTURE.id.includes("YOUR")) return;
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.AGRICULTURE.id}/export?format=csv&gid=${SHEETS.AGRICULTURE.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const hIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes("component")));
        if (hIdx === -1) return;
        const compIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("component"));
        const targetIdx = rows[hIdx].findIndex(c => String(c).toLowerCase().includes("target"));
        let parsed = [];
        for(let i=hIdx+1; i<rows.length; i++){
          if(rows[i][compIdx] && !rows[i][compIdx].toLowerCase().includes("total")){
            const tgt = parseFloat(String(rows[i][targetIdx]).replace(/[^\d.-]/g, '')) || 0;
            if(tgt > 0) {
              parsed.push({ name: rows[i][compIdx].substring(0,10) + "..", target: tgt });
            }
          }
          if(parsed.length >= 5) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(SHEETS.AGRICULTURE.id.includes("YOUR")) return <div className="text-center mt-12 text-gray-400">Waiting for Sheet ID...</div>;
  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="target" name="Target" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniCooperatives() {
  const [data, setData] = useState([]);
  useEffect(() => {
    if(SHEETS.COOPERATIVES.id.includes("YOUR")) return;
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.COOPERATIVES.id}/export?format=csv&gid=${SHEETS.COOPERATIVES.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const hIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes("tehsil")));
        if (hIdx === -1) return;
        let parsed = [];
        for(let i=hIdx+1; i<rows.length; i++){
          if(rows[i][0] && !rows[i][0].toLowerCase().includes("total")){
            parsed.push({
              name: rows[i][0].substring(0,8),
              total: parseFloat(rows[i][1]) || 0,
              active: parseFloat(rows[i][2]) || 0
            });
          }
          if(parsed.length >= 6) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(SHEETS.COOPERATIVES.id.includes("YOUR")) return <div className="text-center mt-12 text-gray-400">Waiting for Sheet ID...</div>;
  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip cursor={{fill: '#f3f4f6'}} />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Bar dataKey="total" name="Total Soc." fill="#9ca3af" radius={[3, 3, 0, 0]} />
        <Bar dataKey="active" name="Active Soc." fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniDairy() {
  const [data, setData] = useState([]);
  useEffect(() => {
    if(SHEETS.DAIRY.id.includes("YOUR")) return;
    Papa.parse(`https://docs.google.com/spreadsheets/d/${SHEETS.DAIRY.id}/export?format=csv&gid=${SHEETS.DAIRY.gid}`, {
      download: true, header: false, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        let parsed = [];
        for(let i=0; i<rows.length; i++){
          const row = rows[i];
          if(row[0] && row[1] && !row[0].toLowerCase().includes("total") && !isNaN(parseFloat(row[2]))){
             parsed.push({
               name: (row[0]).substring(5, 10), // Shorten date
               val: parseFloat(row[2]) || 0
             });
          }
          if(parsed.length >= 6) break;
        }
        setData(parsed);
      }
    });
  }, []);

  if(SHEETS.DAIRY.id.includes("YOUR")) return <div className="text-center mt-12 text-gray-400">Waiting for Sheet ID...</div>;
  if(!data.length) return <div className="text-center mt-12 text-gray-400 animate-pulse">Loading Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
        <Line type="monotone" dataKey="val" name="Trainees" stroke="#f97316" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default DcDashboardMainPage;