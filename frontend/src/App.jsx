import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Core Pages ---
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/loginPage";

// --- Components ---
import Data from "./components/Menrega/Data";
import RepresentData from "./components/Menrega/RepresentData";
import Dashboard from "./components/Menrega/Dashboard";

// --- Main Dashboards ---
import DcDashboardMainPage from "./pages/dcDashboardPage/dcMainPage/DcDashboardMainPage";
import StarMarkMainPage from "./pages/dcDashboardPage/StarMarked/StarMarked.jsx";
import WeeklyReview from "./pages/dcDashboardPage/WeeklyReview/WeeklyReview.jsx";
// --- Department Dashboards ---
import MnregaDashboard from "./pages/MnregaDashboard";
import HealthDashboard from "./pages/HealthDashboard";
import PoliceDashboard from "./pages/PoliceDashboard";
import AgricultureDashboard from "./pages/AgricultureDashboard";
import EducationDashboard from "./pages/EducationDashboard";
import PwdDashboard from "./pages/PwdDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import EnvironmentDashboard from "./pages/EnvironmentDashboard";
import WaterDashboard from "./pages/WaterDashboard";
import UrbanDashboard from "./pages/UrbanDashboard";
import LabourDashboard from "./pages/LabourDashboard";
import WcdDashboard from "./pages/WcdDashboard";
import SocialDashboard from "./pages/SocialDashboard";
import ItDashboard from "./pages/ItDashboard";
import DisasterDashboard from "./pages/DisasterDashboard";
import DbeeDashboard from './pages/DbeeDashboard';
import AnimalHusbandryDashboard from './pages/AnimalHusbandryDashboard';
import CooperativesDashboard from './pages/CooperativesDashboard';
import DairyDashboard from './pages/DairyDashboard';
import FisheriesDashboard from './pages/FisheriesDashboard';
import MarkfedDashboard from './pages/MarkfedDashboard';
import RsetiDashboard from "./pages/RsetiDashboard";
import HealthIndicatorDashboard from "./pages/HealthIndicatorDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Core Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Main Dashboards */}
        <Route path="/dashboard" element={<DcDashboardMainPage />} />
        <Route path="/star-marked" element={<StarMarkMainPage />} />
        <Route path="/weekly-review" element={<WeeklyReview />} />
        <Route path="/dashboard-overview" element={<Dashboard />} />
        <Route path="/dashboard/:departmentId" element={<MnregaDashboard />} />

        {/* Individual Department Routes */}
        <Route path="/health-dashboard" element={<HealthDashboard />} />
        <Route path="/education-dashboard" element={<EducationDashboard />} />
        <Route path="/mnrega-dashboard" element={<MnregaDashboard />} />
        <Route path="/police-dashboard" element={<PoliceDashboard />} />
        <Route path="/agriculture-dashboard" element={<AgricultureDashboard />} />
        <Route path="/pwd-dashboard" element={<PwdDashboard />} />
        <Route path="/finance-dashboard" element={<FinanceDashboard />} />
        <Route path="/environment-dashboard" element={<EnvironmentDashboard />} />
        <Route path="/water-dashboard" element={<WaterDashboard />} />
        <Route path="/urban-dashboard" element={<UrbanDashboard />} />
        <Route path="/labour-dashboard" element={<LabourDashboard />} />
        <Route path="/wcd-dashboard" element={<WcdDashboard />} />
        <Route path="/social-dashboard" element={<SocialDashboard />} />
        <Route path="/it-dashboard" element={<ItDashboard />} />
        <Route path="/dbee-dashboard" element={<DbeeDashboard />} />
        <Route path="/disaster-dashboard" element={<DisasterDashboard />} />
        <Route path="/animalhusbandry-dashboard" element={<AnimalHusbandryDashboard />} />
        <Route path="/cooperatives-dashboard" element={<CooperativesDashboard />} />
        <Route path="/dairy-dashboard" element={<DairyDashboard />} />
<Route path="/fisheries-dashboard" element={<FisheriesDashboard />} />
<Route path="/markfed-dashboard" element={<MarkfedDashboard />} />
<Route path="/rseti-dashboard" element={<RsetiDashboard />} />
<Route path="/healthindicator-dashboard" element={<HealthIndicatorDashboard />} />
      </Routes>
      
    </Router>
  );
}

export default App;