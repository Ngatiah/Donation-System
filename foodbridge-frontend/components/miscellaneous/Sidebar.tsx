// // import React from "react";
// // import { Link } from "react-router-dom";

// // const Sidebar: React.FC = () => {
// //   return (
// //     // <div className="flex">
// //     <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-white shadow-md p-4 z-10">
// //       <h2 className="text-blue-600 font-bold text-4xl mb-6">
// //         Food<span className="text-gray-800">Bridge</span>
// //       </h2>
// //       <nav className="space-y-6">
// //         <Link
// //           to="/home"
// //           className="flex items-center text-blue-500 font-semibold"
// //         >
// //           <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path d="M3 12l7-8 7 8v6a1 1 0 01-1 1h-4v-4H8v4H4a1 1 0 01-1-1v-6z" />
// //           </svg>
// //           <span className="hidden md:inline">Home</span>
// //         </Link>
// //         <Link
// //           to="/view-profile"
// //           className="flex items-center text-blue-500 font-semibold"
// //         >
// //           {/* <!-- User Icon --> */}
// //           <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 1112 0H4z" />
// //           </svg>
// //           <span className="hidden md:inline">Profile</span>
// //         </Link>
// //         {/* <Link to="#" className="flex items-center text-blue-500 font-semibold"> */}
// //         <Link
// //           to="/view-more"
// //           className="flex items-center text-blue-500 font-semibold"
// //         >
// //           {/* <!-- User Icon --> */}
// //           <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 1112 0H4z" />
// //           </svg>
// //           <span className="hidden md:inline">Donations</span>
// //         </Link>
// //         <Link
// //           to="/donations-history"
// //           className="flex items-center text-blue-500 font-semibold"
// //         >
// //           {/* <!-- History Icon (Clock) --> */}
// //           <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path
// //               fillRule="evenodd"
// //               d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-8.75V6a.75.75 0 00-1.5 0v4.25c0 .414.336.75.75.75h3a.75.75 0 000-1.5H10.75z"
// //               clipRule="evenodd"
// //             />
// //           </svg>
// //           <span className="hidden md:inline">History</span>
// //         </Link>
// //         <Link
// //           to="/logout"
// //           className="flex items-center text-blue-500 font-semibold"
// //         >
// //           {/* <!-- Logout Icon --> */}
// //           <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
// //             <path
// //               fillRule="evenodd"
// //               d="M3 4.5A1.5 1.5 0 014.5 3h5a1.5 1.5 0 010 3h-5A1.5 1.5 0 013 4.5zm11.22 4.28a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l1.72-1.72H7a.75.75 0 010-1.5h8.94l-1.72-1.72a.75.75 0 010-1.06z"
// //               clipRule="evenodd"
// //             />
// //           </svg>
// //           <span className="hidden md:inline">Logout</span>
// //         </Link>
// //       </nav>
// //     </aside>
// //     // </div>
// //   );
// // };
// // export default Sidebar;
// import React from "react";
// import { Link } from "react-router-dom";
// import { X } from "lucide-react";

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
//   return (
//     <aside
//       className={`fixed md:static inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-700 to-blue-800 text-white z-30 transform transition-transform duration-300 ease-in-out shadow-xl
//         ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
//     >
//       <div className="flex flex-col h-full p-4">
//         {/* Close button for mobile */}
//         <button
//           onClick={onClose}
//           className="md:hidden self-end p-2 rounded-full hover:bg-blue-600 mb-4"
//         >
//           <X className="h-5 w-5" />
//         </button>

//         {/* Logo */}
//         <div className="mb-8 px-2">
//           <h2 className="text-2xl font-bold">
//             <span className="text-white">Food</span>
//             <span className="text-green-300">Bridge</span>
//           </h2>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-2">
//           <NavItem
//             to="/home"
//             icon={
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
//                 />
//               </svg>
//             }
//             label="Home"
//             onClick={onClose}
//           />

//           {/* Other nav items... */}
//         </nav>

//         {/* User profile */}
//         <div className="mt-auto pt-4 border-t border-blue-600">
//           <div className="flex items-center">
//             <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-blue-800 font-semibold">
//               U
//             </div>
//             <div className="ml-3">
//               <p className="text-sm font-medium text-white">User Name</p>
//               <p className="text-xs text-blue-200">user@example.com</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// };

// const NavItem: React.FC<{
//   to: string;
//   icon: React.ReactNode;
//   label: string;
//   onClick: () => void;
// }> = ({ to, icon, label, onClick }) => {
//   return (
//     <Link
//       to={to}
//       className="flex items-center p-3 rounded-lg hover:bg-blue-600 hover:bg-opacity-30 transition-colors"
//       onClick={onClick}
//     >
//       <span className="text-green-300">{icon}</span>
//       <span className="ml-3 font-medium">{label}</span>
//     </Link>
//   );
// };

// export default Sidebar;
import React from "react";
import { Link } from "react-router-dom";
import { Home, User, Box, Clock, LogOut } from "lucide-react";
import Logo from "../miscellaneous/Logo";
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 w-16 md:w-64 bg-stone-200 text-gray-800 z-30 transform transition-transform duration-300 ease-in-out shadow-xl
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      <div className="flex flex-col h-full p-2 md:p-4">
        {/* Logo - Compact on mobile */}
        <div className="mb-6 px-2 hidden md:block">
          <Logo size="md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <NavItem
            to="/home"
            icon={<Home className="h-5 w-5" />}
            label="Home"
            onClick={onClose}
          />

          <NavItem
            to="/view-profile"
            icon={<User className="h-5 w-5" />}
            label="Profile"
            onClick={onClose}
          />

          <NavItem
            to="/view-more"
            icon={<Box className="h-5 w-5" />}
            label="Donations"
            onClick={onClose}
          />

          <NavItem
            to="/donations-history"
            icon={<Clock className="h-5 w-5" />}
            label="History"
            onClick={onClose}
          />
        </nav>

        {/* Logout */}
        <div className="mt-auto">
          <NavItem
            to="/logout"
            icon={<LogOut className="h-5 w-5" />}
            label="Logout"
            onClick={onClose}
          />
        </div>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ to, icon, label, onClick }) => {
  return (
    <Link
      to={to}
      className="flex items-center p-2 md:p-3 rounded-lg hover:bg-blue-700 transition-colors"
      onClick={onClick}
    >
      <span className="text-white">{icon}</span>
      <span className="ml-3 font-medium hidden md:inline">{label}</span>
    </Link>
  );
};

export default Sidebar;
