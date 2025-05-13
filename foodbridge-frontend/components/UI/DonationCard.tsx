import React from 'react'


const DonationCard = ()=> {
  return (
    <div className="bg-white p-4 rounded shadow text-left m-2">
                  <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/>
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
  )
}
export default DonationCard;