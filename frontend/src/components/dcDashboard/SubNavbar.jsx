import React, { useState } from "react";
import { Link } from "react-router-dom";

function SubNavbar() {
  // State to handle dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Array of all departments + DC Main Dashboard
  const departments = [
    "Health", "Education", "MNREGA", "Agriculture", 
    
     
    "DBEE", "RSETI", "Animal Husbandry", 
    "Fisheries", "Dairy", "Cooperatives", "Markfed", 
    "DCPO", "DSSO", "DSWO", "DPO", "Health Indicator", "Deaddiction"
  ];

  return (
    <div className="w-full bg-blue-600 text-white shadow-sm">
      <div className="max-w-7xl mx-auto flex gap-6 px-6 py-2 items-center">
        
        <Link
          to="/dashboard"
          className="hover:bg-blue-800 px-4 py-2 rounded transition"
        >
          DC Dashboard
        </Link>

        {/* --- Departments Dropdown --- */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="hover:bg-blue-800 px-4 py-2 rounded transition focus:outline-none flex items-center gap-1"
          >
            Departments <span>▾</span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white text-gray-800 shadow-xl rounded-md z-50 max-h-80 overflow-y-auto border border-gray-100">
              {departments.map((dept, index) => (
                <Link
                  key={index}
                  // This dynamically creates routes like "/fisheries-dashboard" or "/animalhusbandry-dashboard"
                  to={dept === "DC" ? "/dashboard" : `/${dept.toLowerCase().replace(/\s+/g, '')}-dashboard`} 
                  onClick={() => setIsDropdownOpen(false)} // Closes dropdown on click
                  className="block px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 transition border-b border-gray-50 last:border-0"
                >
                  {dept}
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* --------------------------- */}

        <Link
          to="/star-marked"
          className="hover:bg-blue-800 px-4 py-2 rounded transition"
        >
          ⭐ Star Marked
        </Link>

        <Link
          to="/weekly-review"
          className="hover:bg-blue-800 px-4 py-2 rounded transition"
        >
          Weekly Review
        </Link>

        <Link
          to="/court-cases"
          className="hover:bg-blue-800 px-4 py-2 rounded transition"
        >
          Court Cases
        </Link>

      </div>
    </div>
  );
}

export default SubNavbar;