import React from 'react'
import {Link} from 'react-router-dom'

const Sidebar : React.FC= ()=> {
  return (
    // <div className="flex">
    <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-white shadow-md p-4 z-10">
      <h2 className="text-blue-600 font-bold text-4xl mb-6">Food<span className="text-gray-800">Bridge</span></h2>
      <nav className="space-y-6">
          <Link to="/home" className="flex items-center text-blue-500 font-semibold">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M3 12l7-8 7 8v6a1 1 0 01-1 1h-4v-4H8v4H4a1 1 0 01-1-1v-6z"/></svg>
              <span className="hidden md:inline">Home</span>
          </Link>
          <Link to="/view-profile" className="flex items-center text-blue-500 font-semibold">
              {/* <!-- User Icon --> */}
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 1112 0H4z" />
              </svg>
              <span className="hidden md:inline">Profile</span>
          </Link>
           {/* <Link to="#" className="flex items-center text-blue-500 font-semibold"> */}
           <Link to="/view-more" className="flex items-center text-blue-500 font-semibold">
              {/* <!-- User Icon --> */}
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 1112 0H4z" />
              </svg>
              <span className="hidden md:inline">Donations</span>
          </Link>
          <Link to="/donations-history" className="flex items-center text-blue-500 font-semibold">
              {/* <!-- History Icon (Clock) --> */}
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-8.75V6a.75.75 0 00-1.5 0v4.25c0 .414.336.75.75.75h3a.75.75 0 000-1.5H10.75z" clipRule="evenodd" />
              </svg>
              <span className="hidden md:inline">History</span>
          </Link>
          <Link to="/logout" className="flex items-center text-blue-500 font-semibold">
              {/* <!-- Logout Icon --> */}
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h5a1.5 1.5 0 010 3h-5A1.5 1.5 0 013 4.5zm11.22 4.28a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l1.72-1.72H7a.75.75 0 010-1.5h8.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
              <span className="hidden md:inline">Logout</span>
          </Link> 
      </nav>
  </aside>
  // </div>
  )
}
export default Sidebar;