import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

interface DonationHistoryItem {
  id: number; 
  donor_name: string;
  recipient_name: string;
  food_type: string;
  matched_quantity: number; 
  food_description: string;
  
}

const DonationHistory: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [history, setHistory] = useState<DonationHistoryItem[]>([]); 
  const [error, setError] = useState<string | null>(null); 
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true); 
        setError(null); 

        const res = await fetch('http://localhost:8003/FoodBridge/donations/donation-history/', {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
        });

        const data = await res.json(); // Always parse JSON
        
        if (!res.ok) {
          // If res.ok is false, data will contain error details
          throw new Error(data.detail || data.error || 'Failed to fetch donation history');
        }

        setHistory(data || []); 
      } catch (err) { 
        console.error("Error fetching donation history:", err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    } else {
      setLoading(false); 
      setError("Authentication token not found. Please log in.");
    }
  }, [token]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading donation history...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-3xl/10 font-bold mb-6 text-center">Donation History</h2>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {history.length === 0 && !error && <p className="text-gray-600 text-center">No donation matches yet. Keep an eye out for new opportunities!</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item: DonationHistoryItem) => ( // Use DonationHistoryItem for type
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-lg text-left border border-gray-100 transform hover:scale-105 transition-transform duration-200 ease-in-out">
            <h3 className="font-bold text-xl text-indigo-700 mb-2">{item.food_type}</h3>
            <p className="text-sm text-gray-700 mb-1">
              **Donor:** <span className="font-medium">{item.donor_name}</span>
            </p>
            <p className="text-sm text-gray-700 mb-2">
              **Recipient:** <span className="font-medium">{item.recipient_name}</span>
            </p>
            <p className="text-sm text-gray-800">
              **Quantity:** <strong className="text-lg text-green-700">{item.matched_quantity} kg</strong>
            </p>
            {item.food_description && (
              <p className="text-xs text-gray-500 italic mt-2">"{item.food_description}"</p>
            )}
            {/* You can add a button for status or actions if needed, e.g., "Fulfilled" or "Contact Donor" */}
            {/* <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">View Details</button> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationHistory;