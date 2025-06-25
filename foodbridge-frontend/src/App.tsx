// import React, { useState } from "react";
// import { Route, Routes, Navigate, useLocation } from "react-router-dom";
// import Dashboard from "../components/miscellaneous/Dashboard";
// import SignUp from "../components/auth/register";
// import SignIn from "../components/auth/login";
// import Profile from "../components/profile/Profile";
// import EditProfile from "../components/profile/EditProfile";
// import Sidebar from "../components/miscellaneous/Sidebar";
// import Donate from "../components/donations/Donate";
// import Logout from "../components/auth/logout";
// import DonationHistory from "../components/donations/DonationHistory";
// // import RecipientMatches from '../components/donations/AllMatches'
// import ViewMore from "../components/donations/ViewMore";
// import { Menu } from "lucide-react";
// import "./App.css";
// const App: React.FC = () => {
//   const location = useLocation();
//   const isAuth =
//     location.pathname === "/login" || location.pathname === "/register";
//   // In your Dashboard component:
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   // Toggle function
//   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

//   // Add a menu button in your mobile header
//   <button className="md:hidden p-2" onClick={toggleSidebar}>
//     <Menu className="h-5 w-5" />
//   </button>;

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex">
//       {!isAuth && <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />}
//       <main>
//         <Routes>
//           <Route path="/" element={<Navigate to="/login" />} />
//           <Route path="login" element={<SignIn />} />
//           <Route path="logout" element={<Logout />} />
//           <Route path="register" element={<SignUp />} />
//           <Route path="home" element={<Dashboard />} />
//           <Route path="view-profile" element={<Profile />} />
//           <Route path="edit-profile" element={<EditProfile />} />

//           <Route path="donate" element={<Donate />} />

//           <Route path="view-more" element={<ViewMore />} />

//           <Route path="donations-history" element={<DonationHistory />} />
//         </Routes>
//       </main>
//     </div>
//   );
// };

// export default App;
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
import ForgotPassword from "../components/auth/ForgotPassword";
import DonationHistory from "../components/donations/DonationHistory";
import ViewMore from "../components/donations/ViewMore";
import { Menu } from "lucide-react";
// import "./App.css";

const App: React.FC = () => {
  const location = useLocation();
  const isAuth =
    location.pathname === "/login" || location.pathname === "/register";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-green-50 flex overflow-auto">
      {!isAuth && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <main className="flex-1 w-full min-h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="login" element={<SignIn />} />
          <Route path="forgot-password" element={<ForgotPassword />} />

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
