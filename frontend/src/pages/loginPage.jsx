import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function LoginPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        try{
            const res = await axios.post("http://localhost:3000/api/auth/login",{
                email,
                password
            },
            {withCredentials:true})

            // --- EMAIL CHECKS ---
            if (email.trim() === "dc@masterdashboard.gov") {
                navigate("/dashboard");
                return;
            } else if(email.trim() === "health@masterdashboard.gov") {
                navigate("/health-dashboard");
                return;
            } else if(email.trim() === "education@masterdashboard.gov") {
                navigate("/education-dashboard");
                return;
            } else if(email.trim() === "mnrega@masterdashboard.gov") { // ADDED MNREGA
                navigate("/mnrega-dashboard");
                return;
            } else if(email.trim() === "agriculture@masterdashboard.gov") {
                navigate("/agriculture-dashboard");
                return;
            } else if(email.trim() === "pwd@masterdashboard.gov") {
                navigate("/pwd-dashboard");
                return;
            } else if(email.trim() === "finance@masterdashboard.gov") {
                navigate("/finance-dashboard");
                return;
            } else if(email.trim() === "environment@masterdashboard.gov") {
                navigate("/environment-dashboard");
                return;
            } else if(email.trim() === "water@masterdashboard.gov") {
                navigate("/water-dashboard");
                return;
            } else if(email.trim() === "urban@masterdashboard.gov") {
                navigate("/urban-dashboard");
                return;
            } else if(email.trim() === "labour@masterdashboard.gov") {
                navigate("/labour-dashboard");
                return;
            } else if(email.trim() === "wcd@masterdashboard.gov") {
                navigate("/wcd-dashboard");
                return;
            } else if(email.trim() === "social@masterdashboard.gov") {
                navigate("/social-dashboard");
                return;
            } else if(email.trim() === "it@masterdashboard.gov") {
                navigate("/it-dashboard");
                return;
            } else if(email.trim() === "police@masterdashboard.gov") {
                navigate("/police-dashboard");
                return;
            } else if(email.trim() === "disaster@masterdashboard.gov") { // ADDED DISASTER
                navigate("/disaster-dashboard");
                return;
            }
            
            // --- ROLE CHECKS ---
            switch(res.data.role.trim()){
                case "Health Department": navigate("/health-dashboard"); break;
                case "Education Department": navigate( "/education-dashboard"); break;
                case "PWD Department": navigate("/pwd-dashboard"); break;
                case "Finance Department": navigate("/finance-dashboard"); break;
                case "Environment Department": navigate("/environment-dashboard"); break;
                case "Water Department": navigate("/water-dashboard"); break;
                case "Urban Department": navigate("/urban-dashboard"); break;
                case "Labour Department": navigate("/labour-dashboard"); break;
                case "WCD Department": navigate("/wcd-dashboard"); break;
                case "Social Department": navigate("/social-dashboard"); break;
                case "IT Department": navigate("/it-dashboard"); break;
                case "Disaster Department": navigate("/disaster-dashboard"); break;
                case "Deputy Commissioner": navigate ("/deputy"); break;
                case "Police Department": navigate("/police-dashboard"); break;
                case "Agriculture Department": navigate("/agriculture-dashboard"); break;
                case "Rural Development": navigate ( "/mnrega-dashboard"); break;
                default: alert("Unauthorized or unknown role.");
            }
        }catch(err){
            alert("Login Failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <Navbar/>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white-5 to-white-10 ">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                    <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Login</h2>
                    <input type="email" placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="mt-6 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"/>
                    <button onClick={handleLogin} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md">Login</button>
                </div>
            </div>
            <Footer/>
        </div>
    );
}

export default LoginPage;