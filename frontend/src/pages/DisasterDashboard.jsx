// // import React, { useState } from "react";
// // // import Navbar from "../componensts/Menrega/Navbar.jsx";
// // import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
// // import ProfileSidebar from "../components/common/ProfileSidebar.jsx";
// // import BudgetChart from "../components/charts/BudgetChart.jsx";
// // import YearComparisonChart
// //  from "../components/charts/YearComparisonChart.jsx";
// //  import TopDepartmnetsChart from "../components/charts/TopDepartments.jsx";

// // function MnregaDashboard() {
// //   const [isOpen, setIsOpen] = useState(false);

// //   const toggleSidebar = () => {
// //     setIsOpen(!isOpen);
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-100">
      
// //       {/* Navbar */}
// //       <ProfileNavbar toggleSidebar={toggleSidebar} />

// //       {/* Content Area */}
// //       <div className="flex relative">
        
// //         {/* Main Content */}
// //         <div className="flex-1 p-6">
// //           <h2 className="text-xl font-semibold">
// //             MNREGA Dashboard Content Area
// //           </h2>
// //         </div>

// //         {/* Sidebar */}
// //         <ProfileSidebar isOpen={isOpen} />
// //       </div>
// //     </div>
// //   );
// // }

// // export default MnregaDashboard;


// import React, { useState } from "react";
// import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
// import ProfileSidebar from "../components/common/ProfileSidebar.jsx";

// import BudgetChart from "../components/charts/BudgetChart.jsx";
// import YearComparisonChart from "../components/charts/YearComparisonChart.jsx";
// import TopDepartmentsChart from "../components/charts/TopDepartmentsChart.jsx";

// function MnregaDashboard() {
//   const [isOpen, setIsOpen] = useState(false);

//   const toggleSidebar = () => {
//     setIsOpen(!isOpen);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
      
//       {/* Navbar */}
//       <ProfileNavbar toggleSidebar={toggleSidebar} />

//       <div className="flex relative">

//         {/* Sidebar */}
//         <ProfileSidebar isOpen={isOpen} />

//         {/* Main Content */}
//         <div className="flex-1 p-6 space-y-10">
          
//           <h1 className="text-2xl font-bold">MNREGA Dashboard</h1>

//           {/* Monthly Budget */}
//           <div className="bg-white p-6 rounded shadow">
//             <h2 className="text-lg font-semibold mb-4">
//               Monthly Budget (2024)
//             </h2>
//             <BudgetChart />
//           </div>

//           {/* Year Comparison */}
//           <div className="bg-white p-6 rounded shadow">
//             <h2 className="text-lg font-semibold mb-4">
//               Year Comparison
//             </h2>
//             <YearComparisonChart />
//           </div>

//           {/* Top Departments */}
//           <div className="bg-white p-6 rounded shadow">
//             <h2 className="text-lg font-semibold mb-4">
//               Top Departments
//             </h2>
//             <TopDepartmentsChart />
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

// export default MnregaDashboard;


import React, { useState } from "react";
import ProfileNavbar from "../components/common/ProfileNavbar.jsx";
import ProfileSidebar from "../components/common/ProfileSidebar.jsx";

import BudgetChart from "../components/charts/BudgetChart.jsx";
import YearComparisonChart from "../components/charts/YearComparisonChart.jsx";
import TopDepartmentsChart from "../components/charts/TopDepartmentsChart.jsx";

function MnregaDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(2024);
  const [department, setDepartment] = useState("all");

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ProfileNavbar toggleSidebar={toggleSidebar} />

      <div className="flex">
        <ProfileSidebar isOpen={isOpen} />

        <div className="flex-1 p-6 space-y-8">

          <h1 className="text-2xl font-bold">MNREGA Dashboard</h1>

          {/* Filters */}
          <div className="flex gap-4">

            <select
              className="p-2 border rounded"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>

            <select
              className="p-2 border rounded"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="1">Department 1</option>
              <option value="2">Department 2</option>
              <option value="3">Department 3</option>
            </select>

          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h3>Total Budget</h3>
              <p className="text-xl font-bold">₹ 12.5 Cr</p>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3>Total Projects</h3>
              <p className="text-xl font-bold">1,240</p>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3>Total Employees</h3>
              <p className="text-xl font-bold">4,560</p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white p-6 rounded shadow">
            <BudgetChart year={year} department={department} />
          </div>

          <div className="bg-white p-6 rounded shadow">
            <YearComparisonChart />
          </div>

          <div className="bg-white p-6 rounded shadow">
            <TopDepartmentsChart year={year} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default MnregaDashboard;