import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

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
  is_missed: boolean;
  is_current_user_the_donor: boolean;
  is_current_user_the_recipient: boolean;
  is_donation_deleted?: boolean;
}

const DonationHistory: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [history, setHistory] = useState<DonationHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

//  const claimedDonationHistory = history.filter(hist =>
//    hist.recipient_name && hist.donor_name && hist.is_claimed && hist.is_donation_deleted && hist.is_missed
//  )

  
  const totalPages = Math.ceil(history.length / itemsPerPage)
  const paginatedDonationsHistory = history.slice((currentPage - 1) * itemsPerPage,currentPage * itemsPerPage)

  return (
    <div className="p-4">
      <h2 className="text-3xl/10 font-bold mb-6 text-center">Donation History</h2>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {history.length === 0 && !error && <p className="text-gray-600 text-center">No donations yet. Keep an eye out for new opportunities!</p>}
    {/* No donations yet. You’ll see your contributions here once you get started! */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedDonationsHistory.map((item: DonationHistoryItem) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-lg text-left border border-gray-100 transform hover:scale-105 transition-transform duration-200 ease-in-out">
            <h3 className="font-bold text-xl text-indigo-700 mb-2">{item.food_type}</h3>

            {/* Conditional display based on the current user's role in THIS specific match */}
            {item.is_current_user_the_donor ? (
              // If the logged-in user is the donor for this match, display recipient's info
              <>
                <p className="text-sm text-gray-700 mb-1">
                  Recipient: <span className="font-medium">{item.recipient_name}</span>
                </p>
                {item.recipient_contact_phone && (
                  <p className="text-sm text-gray-700 mb-2">
                    Recipient Contact: <span className="font-medium">{item.recipient_contact_phone}</span>
                  </p>
                )}
              </>
            ) : item.is_current_user_the_recipient ? (
              // If the logged-in user is the recipient for this match, display donor's info
              <>
                <p className="text-sm text-gray-700 mb-1">
                  Donor: <span className="font-medium">{item.donor_name}</span>
                </p>
                {item.donor_contact_phone && (
                  <p className="text-sm text-gray-700 mb-2">
                    Donor Contact: <span className="font-medium">{item.donor_contact_phone}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-1">
                  Donor: <span className="font-medium">{item.donor_name}</span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  Recipient: <span className="font-medium">{item.recipient_name}</span>
                </p>
              </>
            )}

            {item.food_description && ( 
              <p className="text-sm text-gray-500">
                Description: {item.food_description}
              </p>
            )}


           <p className="text-xs text-gray-500 py-2">
              Status: <span className={`font-semibold ${
                // item.is_claimed  ? 'text-blue-600'  : item.is_missed  ? 'text-red-600'  : 'text-yellow-600' 
                item.is_claimed ? 'text-blue-600' :
                item.is_donation_deleted ? 'text-red-600' : 
                item.is_missed ? 'text-orange-600' : 
                'text-yellow-600'
                }`}>
                 {/* { */}
                  {/* // item.is_claimed ? 'Claimed' : 
                  // item.is_donation_deleted ? 'Unavailable (Donor Removed)' :
                  // item.is_missed ? 'Missed' : 'Go claim this donation'} */}
                {item.is_current_user_the_donor ? (
                  // Logic for DONOR's view
                   item.is_claimed ? 'Claimed' :
                  item.is_donation_deleted ? 'Unavailable  - Removed by You' :
                  item.is_missed ? 'Missed' : 
                  'Waiting for Recipient to Claim'
                ) : (
                  item.is_claimed ? 'You Claimed This' :
                  item.is_donation_deleted ? 'Unavailable (Donor Removed)' :
                  item.is_missed ? 'Missed (Another Recipient Claimed)' : 
                  'Go Claim this Donation' 
                  
                )}
              </span>
            </p>
           

          </div>
        ))}
      </div>
      <>
             {totalPages > 1 && (
                    <div className="flex justify-center mt-6 space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-1 rounded ${
                            currentPage === i + 1
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-blue-200 text-white disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  </>
    </div>
  );
};

export default DonationHistory;