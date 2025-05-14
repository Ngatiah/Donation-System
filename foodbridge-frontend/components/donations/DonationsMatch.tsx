import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const DonationsMatch: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('http://localhost:8003/FoodBridge/donations/donation-matches/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient_food_type: 'maize',
            required_quantity: 0.5,
            lat: -1.3027,
            lng: 36.8729
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Matching failed');
        }

        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    if (token) fetchMatches();
  }, [token]);

  return (
    <div className="p-4">
      {/* <h2 className="text-xl font-semibold mb-4">Donor Matches</h2> */}
      {error && <p className="text-red-600">{error}</p>}
      {matches.length === 0 && !error && <p>No matches yet...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match: any, index: number) => (
          <div key={index} className="bg-white p-4 rounded shadow text-left">
            <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
            <h3 className="font-semibold">{match.food_type}</h3>
            <div className="text-sm text-gray-600 mb-2 font-medium">{match.location || 'Unknown location'}</div>
            <div className="text-sm">Quantity: <strong>{match.quantity || 'N/A'}</strong></div>
            <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationsMatch;
