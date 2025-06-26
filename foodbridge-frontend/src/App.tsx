
import React, { useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Dashboard from "../components/miscellaneous/Dashboard";
import SignUp from "../components/auth/register";
import SignIn from "../components/auth/login";
import Profile from "../components/profile/Profile";
import EditProfile from "../components/profile/EditProfile";
import Sidebar from "../components/miscellaneous/Sidebar";
import Donate from "../components/donations/Donate";
import Logout from "../components/auth/logout";
import DonationHistory from "../components/donations/DonationHistory";
import ViewMore from "../components/donations/ViewMore";
import ForgotPassword from "../components/auth/ForgotPassword";
import EditDonation from "../components/donations/EditDonation";
const App: React.FC = () => {
  const location = useLocation();
  {/* const isAuth =
    location.pathname === "/login" || location.pathname === "/register"; */}
    const isAuth = ["/login", "/register", "/forgot-password"].includes(
    location.pathname
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-green-50 flex overflow-auto">
      {!isAuth && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 w-full min-h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="login" element={<SignIn />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="edit-donation" element={<EditDonation />} />

          <Route path="logout" element={<Logout />} />
          <Route path="register" element={<SignUp />} />
          <Route path="home" element={<Dashboard />} />
          <Route path="view-profile" element={<Profile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="donate" element={<Donate />} />
          <Route path="view-more" element={<ViewMore />} />
          <Route path="donations-history" element={<DonationHistory />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
