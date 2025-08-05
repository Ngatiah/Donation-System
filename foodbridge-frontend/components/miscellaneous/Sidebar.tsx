import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Box,
  Clock,
  LogOut,
  Menu,
  X,
} from "lucide-react";
// import Logo from "./Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggle }) => {
  const location = useLocation();

  return (
    <>
      {/* overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Hamburger Button */}
      {/* <button
        onClick={onToggle}
        className={`sm:hidden block fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg transition-all`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button> */}
      <button
        onClick={onToggle}
        className="block sm:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg transition-all"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>


      {/* <button
        onClick={onToggle}
        className="block sm:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg transition-all"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button> */}

      {/* Sidebar */}
      <aside
          className={`fixed md:relative inset-y-0 left-0 md:w-20 w-64 text-blue z-40 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 flex-1"
        }`}
         
      >
          <div className="flex flex-col h-full p-4">
          <nav className="flex-1 space-y-2 py-4">
            <NavItem to="/home" icon={<Home />} label="Home" activePath={location.pathname} 
          
            onClick={onClose} />
            <NavItem to="/view-more" icon={<Box />} label="Donations" activePath={location.pathname} 
          
            onClick={onClose} />
            <NavItem to="/donations-history" icon={<Clock />} label="History" activePath={location.pathname} 
           
            onClick={onClose} />
            <NavItem to="/view-profile" icon={<User />} label="Profile" activePath={location.pathname} 
           
            onClick={onClose} />
          </nav>

          <div className="mt-auto pt-4">
          <NavItem to="/logout" icon={<LogOut />} activePath={location.pathname} label="Logout" onClick={onClose}/>
          </div>
        </div>
      </aside>
    </>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  activePath: string;
  // collapsed: boolean;
}> = ({ to, icon, label, onClick, activePath, 
  // collapsed 
}) => {
  const isActive = activePath === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all group ${
        // isActive ? "bg-blue-100 text-blue-800" : "hover:bg-blue-50 text-blue-400"
        isActive ? "text-blue-800" : "text-blue-400"
      }`}
    >
      <div className={`text-lg ${isActive ? "text-blue-800" : "group-hover:text-blue-600"}`}>
        {icon}
      </div>
    
      <span className={`transition-opacity duration-200 font-medium sr-only md:inline hidden ${isActive ? "text-blue-800" : "text-blue-400"} `}>
      {/* <span className={`transition-opacity duration-200 font-medium sm:inline hidden md:inline hidden ${isActive ? "text-blue-800" : "text-blue-400"} `}> */}
          {label}
      </span>
     
    </Link>
  );
};

export default Sidebar;

