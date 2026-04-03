import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        // 1. HARDCODED PASSWORD CHECK
        if (password !== "Pass@123") {
            alert("Login Failed: Incorrect password!");
            return; // Stop the login process
        }

        const cleanEmail = email.trim().toLowerCase();

        // 2. EMAIL ROUTING (Only runs if password is Pass@123)
        if (cleanEmail === "dc@masterdashboard.gov") {
            navigate("/dashboard");
        } else if (cleanEmail === "health@masterdashboard.gov") {
            navigate("/health-dashboard");
        } else if (cleanEmail === "education@masterdashboard.gov") {
            navigate("/education-dashboard");
        } else if (cleanEmail === "mnrega@masterdashboard.gov") { 
            navigate("/mnrega-dashboard");
        } else if (cleanEmail === "agriculture@masterdashboard.gov") {
            navigate("/agriculture-dashboard");
        } else if (cleanEmail === "pwd@masterdashboard.gov") {
            navigate("/pwd-dashboard");
        } else if (cleanEmail === "finance@masterdashboard.gov") {
            navigate("/finance-dashboard");
        } else if (cleanEmail === "environment@masterdashboard.gov") {
            navigate("/environment-dashboard");
        } else if (cleanEmail === "water@masterdashboard.gov") {
            navigate("/water-dashboard");
        } else if (cleanEmail === "urban@masterdashboard.gov") {
            navigate("/urban-dashboard");
        } else if (cleanEmail === "labour@masterdashboard.gov") {
            navigate("/labour-dashboard");
        } else if (cleanEmail === "wcd@masterdashboard.gov") {
            navigate("/wcd-dashboard");
        } else if (cleanEmail === "social@masterdashboard.gov") {
            navigate("/social-dashboard");
        } else if (cleanEmail === "it@masterdashboard.gov") {
            navigate("/it-dashboard");
        } else if (cleanEmail === "police@masterdashboard.gov") {
            navigate("/police-dashboard");
        } else if (cleanEmail === "disaster@masterdashboard.gov") { 
            navigate("/disaster-dashboard");
        } else {
            // If they enter Pass@123 but a random email
            alert("Login Failed: Email address not recognized by the system.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white-5 to-white-10 ">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                    <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Login</h2>
                    
                    <input 
                        type="email" 
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)} 
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" 
                    />
                    
                    <input 
                        type="password" 
                        placeholder="Password" 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="mt-6 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    
                    <button 
                        onClick={handleLogin} 
                        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
                    >
                        Login
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default LoginPage;
