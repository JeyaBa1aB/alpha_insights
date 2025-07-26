import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
// Import all pages (these should be created separately)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import PortfolioPage from './pages/PortfolioPage';
import StockResearchPage from './pages/StockResearchPage';
import NotificationsCenter from './pages/NotificationsCenter';
import EducationHub from './pages/EducationHub';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './admin/AdminDashboard';

function App() {
  return (
    <div className="bg-slate-900 text-gray-300 min-h-screen">
      <Navbar />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/education" element={<EducationHub />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/research" element={<StockResearchPage />} />
            <Route path="/notifications" element={<NotificationsCenter />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
