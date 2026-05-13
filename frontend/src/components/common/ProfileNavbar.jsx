import React from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaRegMessage } from "react-icons/fa6";

function ProfileNavbar({ toggleSidebar }) {
  return (
    <div className="h-16 bg-blue-700 text-white flex justify-between items-center px-6 shadow-md">
      
      {/* Left Side */}
      <h1 className="text-lg font-bold">DC Dashboard</h1>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        
        {/* Notification Icon */}
        <IoMdNotificationsOutline className="text-2xl cursor-pointer hover:text-gray-200" />

        {/* Message Icon */}
        <FaRegMessage className="text-xl cursor-pointer hover:text-gray-200" />

        {/* Profile Image */}
        <img
          src="https://i.pravatar.cc/40"
          alt="profile"
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-white"
          onClick={toggleSidebar}
        />
      </div>
    </div>
  );
}

export default ProfileNavbar;