import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import { AuthProvider } from './pages/AuthContext';
import LandingHeader from './components/LandingHeader';
import PrivateRoute from './components/PrivateRoute';

// pages
import Home from './pages/Home';
import ManageUsers from './pages/ManageUsers';
import HomeSettings from './pages/HomeSettings';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import AddDeviceCard from "./components/AddDeviceCard";
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import HomeSetup from './pages/HomeSetup';
import NotFound from './pages/NotFound';
import DashboardGuide from "./components/DashboardGuide"; // Import your DashboardTour component
import './Styles/App.css';

function AppContent() {
  const location = useLocation();

  const validRoutes = [
    '/',
    '/home',
    '/home-setup',
    '/manage-users',
    '/home-settings',
    '/add-device',
    '/rewards',
    '/settings',
  ];

  return (
    <div className="app-container">
      {location.pathname==='/home' ? <DashboardGuide /> : null}
      {/* Conditionally render headers */}
      {location.pathname === '/' ? <LandingHeader /> : validRoutes.includes(location.pathname) && location.pathname !== '/home-setup' ? (
        <Header />
      ) : null}

      {/* Main Content */}
      <div className="main-content">

        {/* Main Content Area */}
        <main className="content-area">
          <Routes>
            {/* Main routes - Navbar sections are handled within Home */}
            <Route path="/" element={<Landing />} />

            {/* Added protected routes to prevent users from accessing pages without authentication. */}
            {/* Protected routes */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/home-setup"
              element={
                <PrivateRoute allowWithoutHome={true}>
                  <HomeSetup />
                </PrivateRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <PrivateRoute>
                  <Rewards />
                </PrivateRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <PrivateRoute>
                  <ManageUsers />
                </PrivateRoute>
              }
            />

            <Route
              path="/add-device/:homeId"
              element={
                <PrivateRoute>
                  <AddDeviceCard />
                </PrivateRoute>
              }
            />
            <Route
              path="/home-settings"
              element={
                <PrivateRoute>
                  <HomeSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            {/* Fallback route for non-existent paths */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

