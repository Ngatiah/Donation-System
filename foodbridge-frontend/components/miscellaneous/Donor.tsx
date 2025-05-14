import React from 'react'

const Donor : React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div  className="bg-white p-4 rounded shadow text-left">
            <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
            <h3 className="font-semibold">food_type</h3>
            {/* <div className="text-sm text-gray-600 mb-2 font-medium">location ||</div> */}
            <div className="text-sm">Quantity: <strong>quantity</strong></div>
            <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
          </div>
      </div>
  )
}
export default Donor;
