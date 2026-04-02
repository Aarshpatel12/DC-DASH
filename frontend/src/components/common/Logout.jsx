import React from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios";
function Logout() {
    const navigate = useNavigate();
    const handleLogout = async () =>{
      try {
        await axios.post(
            "http://localhost:3000/api/auth/logout",
            {},
            {withCredentials:true}
        );
        navigate("/login");
        
      } catch (error) {
        console.error("Logout failed", error);
        
      }
    }
  return (
    <div>
        <button onClick= {handleLogout}>
            Logout
        </button>
      
    </div>
  )
}

export default Logout
