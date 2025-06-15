import React from "react";
import "./App.css";
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
// import RecipientMatches from '../components/donations/AllMatches'
import ViewMore from "../components/donations/ViewMore";

const App: React.FC = () => {
  const location = useLocation();
  const isAuth =
    location.pathname === "/login" || location.pathname === "/register";
  return (
    <div className="flex">
      {!isAuth && <Sidebar />}

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="login" element={<SignIn />} />
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
