import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';

interface DonationHistoryItem {
  id: number;
  donor_name: string;
  recipient_name: string;
  donor_contact_phone: string; 
  recipient_contact_phone: string;
  food_type: string;
  matched_quantity: number;
  food_description: string;
  is_claimed: boolean;
  is_current_user_the_donor: boolean;
  is_current_user_the_recipient: boolean;
}

const AllMatchedDonations: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [history, setHistory] = useState<DonationHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setLoading(false);
        setError("Authentication token not found. Please log in.");
        return;
      }

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

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || data.error || 'Failed to fetch donation history');
        }

        setHistory(data || []);
      } catch (err: any) { 
        console.error("Error fetching donation history:", err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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
        {history.map((item: DonationHistoryItem) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-lg text-left border border-gray-100 transform hover:scale-105 transition-transform duration-200 ease-in-out">
            <h3 className="font-bold text-xl text-indigo-700 mb-2">{item.food_type}</h3>

            {/* Conditional display based on the current user's role in THIS specific match */}
            {item.is_current_user_the_donor ? (
              // If the logged-in user is the donor for this match, display recipient's info
              <>
                <p className="text-sm text-gray-700 mb-1">
                  **Recipient:** <span className="font-medium">{item.recipient_name}</span>
                </p>
                {item.recipient_contact_phone && (
                  <p className="text-sm text-gray-700 mb-2">
                    **Recipient Contact:** <span className="font-medium">{item.recipient_contact_phone}</span>
                  </p>
                )}
              </>
            ) : item.is_current_user_the_recipient ? (
              // If the logged-in user is the recipient for this match, display donor's info
              <>
                <p className="text-sm text-gray-700 mb-1">
                  **Donor:** <span className="font-medium">{item.donor_name}</span>
                </p>
                {item.donor_contact_phone && (
                  <p className="text-sm text-gray-700 mb-2">
                    **Donor Contact:** <span className="font-medium">{item.donor_contact_phone}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-1">
                  **Donor:** <span className="font-medium">{item.donor_name}</span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  **Recipient:** <span className="font-medium">{item.recipient_name}</span>
                </p>
              </>
            )}

            {item.food_description && ( 
              <p className="text-sm text-gray-500">
                **Description:** {item.food_description}
              </p>
            )}
            <p className="text-xs text-gray-500">
              **Status:** <span className={`font-semibold ${item.is_claimed ? 'text-blue-600' : 'text-yellow-600'}`}>
                {item.is_claimed ? 'Claimed' : 'Unclaimed'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllMatchedDonations;