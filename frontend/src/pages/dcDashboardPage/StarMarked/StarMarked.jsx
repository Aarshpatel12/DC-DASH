import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/dcDashboard/Navbar';
import SubNavbar from '../../../components/dcDashboard/SubNavbar';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/14-idXJHzHKCUQxxaqGZi-6S0G20gvPUhK4G16ci2FwI/gviz/tq?tqx=out:csv&gid=213021534";

// IMPORTANT: You will get this URL in Step 2 below!
const GOOGLE_SCRIPT_WEB_APP_URL = "YOUR_GOOGLE_SCRIPT_URL_HERE"; 

function StarMarkMainPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(""); 
  
  // Edit State
  const [editingRowSr, setEditingRowSr] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Filters
  const [selectedOfficer, setSelectedOfficer] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All"); // NEW
  const [selectedTaskStatus, setSelectedTaskStatus] = useState("All"); // NEW
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = () => {
    setLoading(true);
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0 && Object.keys(results.data[0])[0].includes("<!DOCTYPE")) {
           setErrorMsg("Permission Denied: Your Google Sheet is private! Please click 'Share' and set it to 'Anyone with the link'.");
           setLoading(false);
           return;
        }

        const parsedData = processData(results.data);
        if (parsedData.length === 0) {
            setErrorMsg("No valid data found. Make sure your link has the correct 'gid=' for the Star Marked tab!");
        }

        setData(parsedData);
        setLoading(false);
      },
      error: (err) => {
        setErrorMsg("Failed to load Google Sheet. Check your internet connection.");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Smart Data Processing ---
  const processData = (rawData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawData.map(row => {
      const sr = row["Sr"] || row["Sr."] || row["Sr. No"] || row["Task ID "] || "";
      const status = (row["Status"] || row["Status "] || "In progress").trim();
      const priority = (row["Priority"] || row["Priority "] || "Medium").trim();
      const officer = (row["Marked to Officer"] || row["Assigned to "] || "Unknown").trim();
      const subject = row["Subject"] || row["Task Name (Description of case) "] || "No Subject";
      const remarks = row["Remarks"] || row["Notes "] || "";
      const deadlineRaw = row["Deadline"] || row["Due Date "] || "";
      
      // Additional Columns from the Sheet
      const governanceCell = row["Governance Cell"] || "";
      const dealingBranch = row["Dealing Branch "] || ""; 
      const receivedFrom = row[" Received From"] || "";   
      const file = row["File"] || "";
      const entryDateRaw = row["Entry Date"] || "";
      const responseReceived = row["Response Recieved"] || ""; 
      const fileOfResponse = row["File of response received"] || "";

      let deadlineDate = null;
      if (deadlineRaw) {
        const parts = deadlineRaw.split(/[-/]/);
        if (parts.length === 3) deadlineDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }

      let taskStatus = "Pending";
      if (status.toLowerCase() === "completed") {
        taskStatus = "Completed";
      } else if (deadlineDate) {
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff < 0) taskStatus = "Overdue";
        else if (daysDiff <= 3) taskStatus = "Due Soon";
      }

      return {
        ...row,
        Sr: sr,
        "Marked to Officer": officer,
        Priority: priority,
        Subject: subject,
        Remarks: remarks,
        Deadline: deadlineRaw,
        "Governance Cell": governanceCell,
        "Dealing Branch ": dealingBranch,
        " Received From": receivedFrom,
        File: file,
        "Entry Date": entryDateRaw,
        Status: status,
        "Response Recieved": responseReceived,
        "File of response received": fileOfResponse,
        Task_Status: taskStatus
      };
    }).filter(row => row.Sr && String(row.Sr).toLowerCase() !== "sr"); 
  };

  // --- Editing Handlers ---
  const handleEditClick = (row) => {
    setEditingRowSr(row.Sr);
    setEditFormData(row);
  };

  const handleEditChange = (e, field) => {
    setEditFormData({ ...editFormData, [field]: e.target.value });
  };

  const handleSaveClick = async () => {
    // 1. Update the UI immediately so the user doesn't have to wait
    setData(data.map(row => {
      if (row.Sr === editingRowSr) {
        let taskStatus = "Pending";
        if (editFormData.Status.toLowerCase() === "completed") taskStatus = "Completed";
        return { ...editFormData, Task_Status: taskStatus };
      }
      return row;
    }));
    setEditingRowSr(null);

    // 2. Send the updated data to Google Apps Script
    try {
      await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      alert("Failed to save to Google Sheets. Check your script URL.");
    }
  };

const { metrics, chartData, filteredTableData, uniqueOfficers, uniquePriorities, uniqueTaskStatuses } = useMemo(() => {
    let pendingCount = 0, overdueCount = 0, urgentCount = 0;
    const officerMap = {};
    const officersSet = new Set();
    const prioritiesSet = new Set(); // NEW
    const taskStatusesSet = new Set(); // NEW

    data.forEach(row => {
      officersSet.add(row["Marked to Officer"]);
      prioritiesSet.add(row.Priority); // NEW
      taskStatusesSet.add(row.Task_Status); // NEW

      const isPendingStatus = ["Pending", "Due Soon", "Overdue"].includes(row.Task_Status);
      
      if (isPendingStatus) pendingCount++;
      if (row.Task_Status === "Overdue") overdueCount++;
      if (row.Priority.toLowerCase().includes("urgent") && isPendingStatus) urgentCount++;

      if (!officerMap[row["Marked to Officer"]]) officerMap[row["Marked to Officer"]] = { name: row["Marked to Officer"], pendingTasks: 0 };
      if (isPendingStatus) officerMap[row["Marked to Officer"]].pendingTasks++;
    });

    const chartData = Object.values(officerMap).filter(o => o.pendingTasks > 0).sort((a, b) => b.pendingTasks - a.pendingTasks);
    
    // NEW: Added the priority and task status matching rules here
    const filteredTableData = data.filter(row => {
      const matchOfficer = selectedOfficer === "All" || row["Marked to Officer"] === selectedOfficer;
      const matchPriority = selectedPriority === "All" || row.Priority === selectedPriority;
      const matchTaskStatus = selectedTaskStatus === "All" || row.Task_Status === selectedTaskStatus;
      const matchSearch = row.Subject?.toLowerCase().includes(searchQuery.toLowerCase()) || row.Remarks?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchOfficer && matchPriority && matchTaskStatus && matchSearch;
    });

    return {
      metrics: { total: data.length, pending: pendingCount, overdue: overdueCount, urgent: urgentCount },
      chartData, 
      filteredTableData, 
      uniqueOfficers: Array.from(officersSet).sort(),
      uniquePriorities: Array.from(prioritiesSet).sort(), // NEW
      uniqueTaskStatuses: Array.from(taskStatusesSet).sort() // NEW
    };
  }, [data, selectedOfficer, selectedPriority, selectedTaskStatus, searchQuery]); // NEW: Added dependencies here

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <SubNavbar />

      {/* CHANGED: Reduced p-8 space-y-8 to p-4 space-y-4 for higher density */}
      <div className="p-4 mx-auto space-y-4 max-w-full">
        <div className="flex justify-between items-center">
          {/* CHANGED: Smaller header text */}
          <h1 className="text-xl font-bold text-blue-900">Task Management Dashboard</h1>
          <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded shadow hover:bg-blue-700">
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32 text-lg font-semibold text-blue-600">Loading Live Google Sheet Data...</div>
        ) : errorMsg ? (
          <div className="flex justify-center items-center h-32 text-lg font-bold text-red-600 bg-red-100 p-4 rounded border border-red-300">
            ⚠️ {errorMsg}
          </div>
        ) : (
          <>
            {/* CHANGED: Made gap smaller, MetricCards more compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard title="Total Tasks" value={metrics.total} color="text-blue-800" />
              <MetricCard title="Total Pending" value={metrics.pending} color="text-yellow-600" />
              <MetricCard title="Total Overdue" value={metrics.overdue} color="text-red-600" isRed />
              <MetricCard title="Urgent & Pending" value={metrics.urgent} color="text-orange-600" />
            </div>

            {/* CHANGED: Reduced padding and chart height (h-80 -> h-48) to save vertical space */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <h2 className="text-sm font-bold text-gray-800 mb-2">Officer-wise Pending Tasks</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" tick={{fontSize: 10}} />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#eff6ff'}} contentStyle={{fontSize: '12px'}} />
                    <Bar 
                      dataKey="pendingTasks" 
                      name="Pending Tasks" 
                      radius={[0, 2, 2, 0]} 
                      barSize={15}
                      onClick={(data) => setSelectedOfficer(data.name)} // NEW: Sets the dropdown filter when clicked!
                      style={{ cursor: 'pointer' }} // NEW: Makes it look clickable
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.pendingTasks > 5 ? "#dc2626" : "#3b82f6"} 
                          // NEW: Dims the other bars if a specific officer is selected
                          opacity={selectedOfficer === "All" || selectedOfficer === entry.name ? 1 : 0.3} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-3">
                <h2 className="text-sm font-bold text-gray-800">All Tasks Overview</h2>
                
                {/* CHANGED: Allowed the filter container to wrap if screen gets too small */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto text-sm justify-end">
                  
                  {/* Filter 1: Officers */}
                  <select className="border border-gray-300 p-1.5 rounded w-full md:w-32 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)}>
                    <option value="All">All Officers</option>
                    {uniqueOfficers.map(off => <option key={off} value={off}>{off}</option>)}
                  </select>

                  {/* Filter 2: Priority (NEW) */}
                  <select className="border border-gray-300 p-1.5 rounded w-full md:w-28 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                    <option value="All">All Priorities</option>
                    {uniquePriorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>

                  {/* Filter 3: Task Status (NEW) */}
                  <select className="border border-gray-300 p-1.5 rounded w-full md:w-32 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" value={selectedTaskStatus} onChange={(e) => setSelectedTaskStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    {uniqueTaskStatuses.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                  </select>

                  {/* Search Bar */}
                  <input type="text" placeholder="Search..." className="border border-gray-300 p-1.5 rounded w-full md:w-40 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              {/* CHANGED: Compact table headers & rows (text-xs, py-1.5, px-2) */}
              <div className="overflow-x-auto rounded border border-gray-200" style={{maxHeight: '50vh'}}>
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-blue-600 text-white sticky top-0 z-20">
                    <tr>
                      <th className="px-2 py-1.5 font-semibold">Actions</th>
                      <th className="px-2 py-1.5 font-semibold">Sr</th>
                      <th className="px-2 py-1.5 font-semibold">Officer</th>
                      <th className="px-2 py-1.5 font-semibold">Priority</th>
                      <th className="px-2 py-1.5 font-semibold">Gov. Cell</th>
                      <th className="px-2 py-1.5 font-semibold">Dealing Branch</th>
                      <th className="px-2 py-1.5 font-semibold w-48">Subject</th>
                      <th className="px-2 py-1.5 font-semibold">Received From</th>
                      <th className="px-2 py-1.5 font-semibold">File</th>
                      <th className="px-2 py-1.5 font-semibold">Entry Date</th>
                      <th className="px-2 py-1.5 font-semibold">Deadline</th>
                      <th className="px-2 py-1.5 font-semibold">Status</th>
                      <th className="px-2 py-1.5 font-semibold">Resp. Received</th>
                      <th className="px-2 py-1.5 font-semibold">Remarks</th>
                      <th className="px-2 py-1.5 font-semibold">File of Resp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableData.map((row, idx) => {
                      const isEditing = editingRowSr === row.Sr;
                      
                      let rowStyle = "border-b hover:bg-gray-50";
                      if (row.Task_Status === "Overdue" && !isEditing) rowStyle = "bg-red-50 border-b hover:bg-red-100 text-red-900";
                      else if (row.Priority.toLowerCase().includes("urgent") && row.Task_Status !== "Completed" && !isEditing) rowStyle = "bg-orange-50 border-b hover:bg-orange-100";

                      // Helper function for compact inputs
                      const inputClass = "border border-gray-300 rounded px-1 py-0.5 w-full focus:outline-none focus:border-blue-500 bg-white";

                      return (
                        <tr key={idx} className={rowStyle}>
                          
                          <td className="px-2 py-1 bg-white sticky left-0 border-r z-10 w-20">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button onClick={handleSaveClick} className="text-green-600 font-bold hover:underline">Save</button>
                                <button onClick={() => setEditingRowSr(null)} className="text-gray-500 hover:underline">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditClick(row)} className="text-blue-600 font-bold hover:underline">Edit</button>
                            )}
                          </td>

                          <td className="px-2 py-1 font-medium">{row.Sr}</td>
                          
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData["Marked to Officer"]} onChange={(e) => handleEditChange(e, "Marked to Officer")} /> : row["Marked to Officer"]}</td>
                          <td className="px-2 py-1 min-w-[80px]">{isEditing ? <input className={inputClass} value={editFormData.Priority} onChange={(e) => handleEditChange(e, "Priority")} /> : row.Priority}</td>
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData["Governance Cell"]} onChange={(e) => handleEditChange(e, "Governance Cell")} /> : row["Governance Cell"]}</td>
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData["Dealing Branch "]} onChange={(e) => handleEditChange(e, "Dealing Branch ")} /> : row["Dealing Branch "]}</td>
                          
                          <td className="px-2 py-1 min-w-[200px] max-w-[250px]">
                            {isEditing ? 
                              <input className={inputClass} value={editFormData.Subject} onChange={(e) => handleEditChange(e, "Subject")} /> 
                              : <div className="truncate" title={row.Subject}>{row.Subject}</div>}
                          </td>
                          
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData[" Received From"]} onChange={(e) => handleEditChange(e, " Received From")} /> : row[" Received From"]}</td>
                          <td className="px-2 py-1 min-w-[80px]">{isEditing ? <input className={inputClass} value={editFormData.File} onChange={(e) => handleEditChange(e, "File")} /> : (row.File ? "📎 Link" : "")}</td>
                          <td className="px-2 py-1 min-w-[80px]">{isEditing ? <input className={inputClass} value={editFormData["Entry Date"]} onChange={(e) => handleEditChange(e, "Entry Date")} /> : row["Entry Date"]}</td>
                          <td className="px-2 py-1 min-w-[80px]">{isEditing ? <input className={inputClass} value={editFormData.Deadline} onChange={(e) => handleEditChange(e, "Deadline")} /> : (row.Deadline || "-")}</td>
                          
                          <td className="px-2 py-1 min-w-[90px]">
                            {isEditing ? 
                              <input className={inputClass} value={editFormData.Status} onChange={(e) => handleEditChange(e, "Status")} /> 
                              : <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.Task_Status === "Completed" ? "bg-green-100 text-green-700" : row.Task_Status === "Overdue" ? "bg-red-200 text-red-800" : "bg-blue-100 text-blue-700"}`}>{row.Task_Status !== "Completed" ? row.Status : "Completed"}</span>
                            }
                          </td>
                          
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData["Response Recieved"]} onChange={(e) => handleEditChange(e, "Response Recieved")} /> : row["Response Recieved"]}</td>
                          <td className="px-2 py-1 min-w-[150px] max-w-[200px]">{isEditing ? <input className={inputClass} value={editFormData.Remarks} onChange={(e) => handleEditChange(e, "Remarks")} /> : <div className="truncate" title={row.Remarks}>{row.Remarks}</div>}</td>
                          <td className="px-2 py-1 min-w-[100px]">{isEditing ? <input className={inputClass} value={editFormData["File of response received"]} onChange={(e) => handleEditChange(e, "File of response received")} /> : (row["File of response received"] ? "📎 Link" : "")}</td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// CHANGED: Shrunk padding and text sizes in the MetricCards
function MetricCard({ title, value, color, isRed }) {
  return (
    <div className={`bg-white p-3 rounded-lg shadow-sm border ${isRed ? 'border-red-200' : 'border-blue-100'}`}>
      <h3 className="text-gray-500 text-xs font-semibold">{title}</h3>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default StarMarkMainPage;