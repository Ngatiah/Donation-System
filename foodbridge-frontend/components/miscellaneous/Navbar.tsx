import React from 'react';

const Navbar : React.FC = () => {
  return (
    <header className="flex justify-between items-center bg-white p-4 shadow sticky top-0 z-10 ml-0 lg:ml-64">
      <input
        type="text"
        placeholder="Search campaign, donor..."
        className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
      />
      <div className="flex items-center gap-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">New Campaign</button>
        <button className="px-3 py-2 bg-gray-100 rounded">Get in touch</button>
        <img
          src="https://via.placeholder.com/40"
          alt="User"
          className="rounded-full w-10 h-10"
        />
      </div>
    </header>
  );
};

export default Navbar;
