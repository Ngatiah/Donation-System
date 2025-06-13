// import React from "react";
// import "./App.css";
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

// const App: React.FC = () => {
//   const location = useLocation();
//   const isAuth =
//     location.pathname === "/login" || location.pathname === "/register";
//   return (
//     <div className="flex">
//       {!isAuth && <Sidebar />}

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
import React, { useState, useEffect } from "react";
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
import { Menu } from "lucide-react";

const App: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuth =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-green-100  ">
      {/* Sidebar - overlay on mobile, always visible on desktop */}
      {!isAuth && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 md:hidden ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col transition-all duration-300 overflow-hidden">
        {/* Mobile header */}
        {!isAuth && (
          <header className="bg-white shadow-sm md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-blue-600 hover:bg-blue-50"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-blue-800">
                Food<span className="text-green-600">Bridge</span>
              </h1>
              <div className="w-6"></div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
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
    </div>
  );
};

export default App;
