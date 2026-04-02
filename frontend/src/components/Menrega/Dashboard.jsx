// import ProfileNavbar from "../common/ProfileNavbar";
// import ProfileSidebar from "../common/ProfileSidebar";
// export default function Dashboard() {
//   return (
//     <div>
//         <ProfileNavbar/>
//     <div className="flex-1 p-8">
//       {/* Welcome Message */}
//       <div className="mb-8">
//         <h2 className="text-3xl font-bold text-gray-800">
//           Welcome, DC Admin!
//         </h2>
//         <p className="text-gray-600">
//           Here is an overview of the current statistics:
//         </p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-6 mb-8">
//         <Card title="Total Workers" value="8,526" />
//         <Card title="Ongoing Projects" value="45" />
//         <Card title="Funds Utilized" value="₹12,85,000" />
//         <Card title="Work Days Provided" value="23,470" />
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-2 gap-6">
//         <ChartBox title="Workers Distribution (Pie Chart)" />
//         <ChartBox title="Employment Trend (Line Chart)" />
//         <ChartBox title="Project Status (Bar Chart)" />
//         <ChartBox title="Fund Allocation (Donut Chart)" />
//       </div>
//     </div>
//     </div>
//   );
// }

// function Card({ title, value }) {
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-md">
//       <h3 className="text-gray-600 text-sm">{title}</h3>
//       <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
//     </div>
//   );
// }

// function ChartBox({ title }) {
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-md h-64 flex items-center justify-center text-gray-500">
//       {title}
//     </div>
//   );
// }


import { Link } from "react-router-dom";
import { useState } from "react";

 import ProfileNavbar from "../common/ProfileNavbar";
import {
  PieChart,
  Pie,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [chartColor, setChartColor] = useState("#2563eb");

  const pieData = [
    { name: "Skilled", value: 400 },
    { name: "Unskilled", value: 600 },
  ];

  const lineData = [
    { month: "Jan", workers: 200 },
    { month: "Feb", workers: 350 },
    { month: "Mar", workers: 500 },
  ];

  const barData = [
    { name: "Completed", projects: 30 },
    { name: "Ongoing", projects: 15 },
  ];

  return (
    <div>
        <ProfileNavbar/>
        
    <div className="p-8">

     {/* 🎨 Header section with Color Picker & Edit Button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <label className="font-semibold mr-3">Choose Graph Color:</label>
          <input
            type="color"
            value={chartColor}
            onChange={(e) => setChartColor(e.target.value)}
          />
        </div>

        {/* --- ADDED EDIT BUTTON --- */}
        <Link 
          to="/edit-dashboard" 
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
        >
          ✏️ Edit Data
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6">

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-xl shadow-md">
          <PieChart width={250} height={250}>
            <Pie
              data={pieData}
              dataKey="value"
              outerRadius={80}
              fill={chartColor}
              label
            />
            <Tooltip />
          </PieChart>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-4 rounded-xl shadow-md">
          <LineChart width={300} height={250} data={lineData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="workers"
              stroke={chartColor}
            />
          </LineChart>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-xl shadow-md">
          <BarChart width={300} height={250} data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="projects"
              fill={chartColor}
            />
          </BarChart>
        </div>

      </div>
    </div>
    </div>
  );
}