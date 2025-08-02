
import React from "react";
import { Link,useLocation } from "react-router-dom";
import {
  Home,
  User,
  Box,
  Clock,
  LogOut,
  // HeartHandshake,
  Menu,
  X,
} from "lucide-react";
import Logo from "../miscellaneous/Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggle }) => {
  const location = useLocation()
  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggle}
        className={`md:hidden fixed top-4 left-4 z-52 p-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg transition-all ${
          isOpen ? "left-64" : "left-4"
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 w-64 bg-stone-50 text-blue z-40 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo with Icon */}
          {/* <div className="flex items-center mb-8 px-2">
            <div className="bg-green-400 p-2 rounded-lg mr-3">
              <HeartHandshake className="h-6 w-6 text-blue-800" />
            </div>
            <h2 className="text-2xl font-bold">
              <span className="text-white">Food</span>
              <span className="text-green-300">Bridge</span>
            </h2>
          </div>  */}
          <Logo />
          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <NavItem
              to="/home"
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              onClick={onClose}
              activePath={location.pathname}

            />
            <NavItem
              to="/view-more"
              icon={<Box className="h-5 w-5" />}
              label="Donations"
              onClick={onClose}
              activePath={location.pathname}

            />
            <NavItem
              to="/donations-history"
              icon={<Clock className="h-5 w-5" />}
              label="History"
              onClick={onClose}
              activePath={location.pathname}

            />
            <NavItem
              to="/view-profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
              onClick={onClose}
              activePath={location.pathname}

            />
          </nav>

          {/* Logout at the bottom */}
          {/* <div className="mt-auto pt-4 border-t border-blue-600"> */}
          <NavItem
            to="/logout"
            icon={<LogOut className="h-5 w-5" />}
            label="Logout"
            onClick={onClose}
            activePath={location.pathname}

          />
        </div>
        {/* </div> */}
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
}> = ({ to, icon, label, onClick, activePath }) => {
  const isActive = activePath === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg transition-colors group
        ${isActive ? "bg-blue-500 text-white" : "hover:bg-blue-400 hover:bg-opacity-30"}
      `}
    >
      <span className={`${isActive ? "text-white" : "text-blue-600"} group-hover:text-white`}>
        {icon}
      </span>
      <span className={`ml-3 font-medium ${isActive ? "text-white" : "text-blue-600"} group-hover:text-white`}>
        {label}
      </span>
    </Link>
  );
};


export default Sidebar;
