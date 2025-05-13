import React from 'react'

export default function Donor() {
  return (
    <>
     {/* Donations */}
     <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Donations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campaign Card */}
            <div className="bg-white p-4 rounded shadow">
              <img
                src="https://via.placeholder.com/300x150"
                alt="Campaign"
                className="rounded mb-2"
              />
              <h3 className="font-semibold">Construction of the Ar-Rahman Mosque</h3>
              <div className="text-sm text-gray-600 mb-2">North Gambia</div>
              <div className="text-sm">
                Raised: <strong>$150,512</strong> / $200,000
              </div>
              <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
                Update Campaign
              </button>
            </div>
            {/* Repeat as needed */}
          </div>
        </section>

        {/* Statistics and Donors */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistics Chart */}
          <div className="bg-white p-4 rounded shadow col-span-2">
            <h3 className="font-semibold mb-2">Statistics</h3>
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              [Chart Placeholder]
            </div>
          </div>

          {/* Donors List */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Top Recipients</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Mark Bernardo</span>
                <span>$15,210</span>
              </li>
              <li className="flex justify-between">
                <span>Willamina Fleming</span>
                <span>$14,400</span>
              </li>
              {/* More donors */}
            </ul>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Donation', value: '$1,214,501' },
            { label: 'Donation Today', value: '$7,925' },
            { label: 'Total Donor', value: '2,581' },
            { label: 'Average Donation', value: '$285.56' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded shadow text-center">
              <h4 className="text-sm text-gray-500">{item.label}</h4>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </section>
    
    </>
  )
}
