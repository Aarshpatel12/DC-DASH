import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/dcDashboard/Navbar';
import SubNavbar from '../../../components/dcDashboard/SubNavbar';
import Papa from 'papaparse';

// 1. YOUR REAL SHEET ID
const SHEET_ID = "1TXWBBeVhTps_7nqq08ApaK9qOSWD_4QD1eXZauUOOiE";

// 2. YOUR APPS SCRIPT URL
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby_WCF4l1-EzIM83cDPeCOAdqPEdUsc6DHiJtjvObyf7zwNDyFOGq6A-wrPCbF8ksb0cQ/exec";

// 3. TAB GIDs
const TABS = [
  { name: "ADC (G)", gid: "174981592" }, 
  { name: "ADC (RD)", gid: "537074213" }, 
  { name: "ADC (UD)", gid: "846764018" }, 
  { name: "ADC (K)", gid: "18822170" },
  { name: "ADC (J)", gid: "18822170" },
  { name: "CMFO", gid: "1227420096" },
  { name: "DRO", gid: "501565659" },
  { name: "AC (G)", gid: "1291568180" },
  { name: "AC (UT)", gid: "1291568180" },
  { name: "RTO", gid: "1563439729" },
  { name: "SDM East", gid: "33416154" },
  { name: "SDM West", gid: "33416154" },
  { name: "SDM Raikot", gid: "537074213" },
  { name: "SDM Samrala", gid: "190794459" },
  { name: "SDM Jagraon", gid: "278920499" },
  { name: "SDM Payal", gid: "778489712" },
  { name: "SDM Khanna", gid: "2054147547" },
  { name: "Health", gid: "2054147547" }
];

export default function WeeklyReview() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS[1]); // Opens ADC (RD) by default
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Tracks which rows have been edited
  const [modifiedRows, setModifiedRows] = useState(new Set());

  // Fetch the raw CSV data
  const fetchData = () => {
    setLoading(true);
    setErrorMsg("");
    
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${activeTab.gid}&t=${Date.now()}`;
    
    Papa.parse(url, {
      download: true,
      header: false,
      skipEmptyLines: false,
      complete: (results) => {
        if (results.data.length > 0 && String(results.data[0][0]).includes("<!DOCTYPE")) {
           setErrorMsg("Permission Denied: You must change your Google Sheet sharing settings to 'Anyone with the link'!");
           setData([]);
        } else {
           setData(results.data);
        }
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Network Error: Could not connect to Google Sheets. Check your internet connection.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
    setModifiedRows(new Set()); // Clear unsaved changes when switching tabs
  }, [activeTab]);

  // Handle typing in cells
  const handleCellChange = (rowIndex, colIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][colIndex] = value;
    setData(updatedData);

    const newModified = new Set(modifiedRows);
    newModified.add(rowIndex);
    setModifiedRows(newModified);
  };

  // Save all modified rows to Google Sheets
  const handleSaveChanges = async () => {
    if (modifiedRows.size === 0) return;
    setIsSaving(true);

    const rowsToSave = Array.from(modifiedRows);
    
    const savePromises = rowsToSave.map(rowIndex => {
      return fetch(APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabName: activeTab.name,
          rowNumber: rowIndex + 1, // Excel rows start at 1
          rowData: data[rowIndex]
        })
      });
    });

    try {
      await Promise.all(savePromises);
      setModifiedRows(new Set());
      
      setTimeout(() => {
        fetchData();
        setIsSaving(false);
      }, 1500);

    } catch (error) {
      console.error('Save error: ', error);
      alert("Error saving some rows to Google Sheets.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <SubNavbar />

      <div className="flex-1 p-6 flex flex-col w-full h-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Top Control Panel */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-t-xl shadow-sm border border-gray-200 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Weekly Review Spreadsheet</h1>
            {isSaving && (
              <span className="flex items-center gap-2 text-sm text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-200">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Saving to Google Sheets...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <select 
              className="border border-gray-300 p-2.5 rounded-lg bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer shadow-sm min-w-[200px]"
              value={activeTab.name}
              onChange={(e) => setActiveTab(TABS.find(t => t.name === e.target.value))}
            >
              {TABS.map(tab => <option key={tab.name} value={tab.name}>{tab.name}</option>)}
            </select>
            
            {/* THE SAVE BUTTON */}
            <button 
              onClick={handleSaveChanges} 
              disabled={modifiedRows.size === 0 || isSaving}
              className={`px-6 py-2.5 rounded-lg shadow-sm transition-all font-bold tracking-wide flex items-center gap-2 ${modifiedRows.size > 0 ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSaving ? "Saving..." : modifiedRows.size > 0 ? `Save Changes (${modifiedRows.size})` : "Saved"}
            </button>

            <button 
              onClick={fetchData} 
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all font-semibold"
              title="Pull latest data from Google Sheets"
            >
              ↻ Refresh
            </button>

            <a 
              href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${activeTab.gid}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-lg shadow-sm hover:bg-blue-50 transition-all font-bold flex items-center gap-2"
              title="Open the real Excel sheet in a new tab"
            >
              📝 Open in Excel
            </a>
          </div>
        </div>

        {/* Excel Grid Container */}
        <div className="flex-1 overflow-auto bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-bold text-gray-600">Loading {activeTab.name}...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center justify-center h-full text-red-700 font-bold text-lg bg-red-50 p-6 text-center">
              ⚠️ {errorMsg}
            </div>
          ) : (
            <table className="w-max min-w-full text-left border-collapse">
              <tbody key={activeTab.name}>
                {data.map((row, rIdx) => {
                  // Make the first two rows distinct headers
                  const isHeaderRow = rIdx < 2;

                  return (
                    <tr key={rIdx} className={`border-b border-gray-200 transition-colors ${isHeaderRow ? 'bg-blue-800 text-white' : 'bg-white hover:bg-blue-50/60'}`}>
                      
                      {/* Excel Row Number (Left fixed column) */}
                      <td className={`w-12 text-center border-r border-gray-200 select-none sticky left-0 z-10 align-middle ${isHeaderRow ? 'bg-blue-900 text-blue-300' : 'bg-gray-50 text-gray-400 font-medium'}`}>
                        {rIdx + 1}
                      </td>

                      {/* Editable Data Cells */}
                      {row.map((cellValue, cIdx) => {
                        return (
                          <td key={cIdx} className="border-r border-gray-200 min-w-[1px] p-0 align-top relative">
                            <textarea
                              className={`
                                w-full block h-full min-h-[60px] p-3.5 outline-none resize-none overflow-hidden whitespace-pre-wrap leading-relaxed transition-all
                                ${isHeaderRow 
                                  ? 'bg-transparent text-white font-bold placeholder-blue-400 focus:bg-blue-700' 
                                  : 'bg-transparent text-gray-800 font-medium placeholder-gray-300 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500'
                                }
                              `}
                              value={cellValue || ""}
                              onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                              rows={1}
                              placeholder={isHeaderRow ? "" : "..."}
                              onInput={(e) => {
                                // Auto-expand height
                                e.target.style.height = "auto";
                                e.target.style.height = e.target.scrollHeight + "px";
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}