import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useAuthStore } from "../../store/authStore";
import UploadedDonations from "./UploadedDonations";
import AllMatches from "./AllMatches";
import { Plus } from "lucide-react";

interface Profile {
  role: string;
  required_food_type?: string;
  required_quantity?: number;
  donor_name: string;
  recipient_name: string;
}

interface DonationMatch {
  id: number;
  donor_name: string;
  recipient_name: string;
  food_type: string;
  matched_quantity: number;
  food_description: string;
  expiry_date: string;
  created_at: string;
  is_claimed: boolean;
  is_missed: boolean;
  is_donation_deleted?: boolean;
}

interface Donation {
  id: number;
  food_type: string;
  quantity: number;
  expiry_date: string;
  donor_name: string;
  food_description?: string;
  created_at: string;
  is_claimed: boolean;
  is_deleted: boolean;
}

interface ViewMoreData {
  profile: Profile;
  all_matches_history: DonationMatch[];
  donations: Donation[];
}

const ViewMore: React.FC = () => {
  const [viewMoreData, setViewMoreData] = useState<ViewMoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [activeTab, setActiveTab] = useState<'unclaimed_donations' | 'unclaimed_matches' >('unclaimed_matches');
  const token = useAuthStore((state) => state.token);

  const fetchViewMoreData = async () => {
    try {
      setError(null);
      setLoading(true);

      // 1. Fetch Profile Data
      const profileRes = await fetch(
        "http://localhost:8003/FoodBridge/donations/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      const responseData = await profileRes.json();
      if (!profileRes.ok) {
        setError(responseData?.detail || "Failed to fetch user profile");
        return;
      }

      const userProfile: Profile = {
        role: responseData.profile.role,
        donor_name: responseData.profile.donor_name,
        recipient_name: responseData.profile.recipient_name,
        required_food_type: responseData.profile.required_food_type,
        required_quantity: responseData.profile.required_quantity,
      };

      let donationData: Donation[] = [];
      let allMatchesHistoryData: DonationMatch[] = [];

      // 2. Fetch User's Donations (for donor) if applicable
      if (userProfile.role === "donor") {
        const donorDonationsRes = await fetch(
          "http://localhost:8003/FoodBridge/donations/create-donations/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );
        const donorDonationsJson = await donorDonationsRes.json();
        if (!donorDonationsRes.ok)
          throw new Error(
            donorDonationsJson?.detail || "Failed to fetch donor's donations"
          );
        donationData = donorDonationsJson;
      } else if (userProfile.role === "recipient") {
        allMatchesHistoryData = responseData.matches;
      }

      // 3. Fetch full match history for both roles
      const matchHistoryRes = await fetch(
        "http://localhost:8003/FoodBridge/donations/donation-history/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      const matchHistoryJson = await matchHistoryRes.json();
      if (!matchHistoryRes.ok) {
        console.error(
          "Failed to fetch match history:",
          matchHistoryJson?.detail
        );
        allMatchesHistoryData = [];
      } else {
        allMatchesHistoryData = matchHistoryJson;
      }

      setViewMoreData({
        profile: userProfile,
        donations: donationData,
        all_matches_history: allMatchesHistoryData,
      });
    } catch (err: any) {
      console.error("ViewMore data fetch error:", err);
      setError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchViewMoreData();
    } else {
      setLoading(false);
      setError("Authentication token not found. Please log in.");
    }
  }, [token]);

  const handleClaimSuccess = (claimedMatchId: number) => {
    setViewMoreData((prevData) => {
      if (!prevData) return null;
      const updatedMatches = prevData.all_matches_history.map((match) =>
        match.id === claimedMatchId ? { ...match, is_claimed: true } : match
      );
      return { ...prevData, all_matches_history: updatedMatches };
    });
  };

  const handleDonationUpdated = (updatedDonation: Donation) => {
    setViewMoreData((prevDashData) => {
      if (!prevDashData) return null;
      const updatedDonationsList = prevDashData.donations.map((d) =>
        d.id === updatedDonation.id ? updatedDonation : d
      );
      return { ...prevDashData, donations: updatedDonationsList };
    });
  };

  const handleDonationDeleted = (deletedDonationId: number) => {
    setViewMoreData((prevDashData) => {
      if (!prevDashData) return null;
      const filteredDonations = prevDashData.donations.filter(
        (d) => d.id !== deletedDonationId
      );
      return { ...prevDashData, donations: filteredDonations };
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ); 

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-4 my-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );

  if (!viewMoreData) return null;

  const { profile, all_matches_history, donations } = viewMoreData;
  const role = profile.role;

  if (!role) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mx-4 my-6">
        <p>User role not found. Please ensure you are logged in.</p>
      </div>
    );
  }

  const recipientUnclaimedMatches = all_matches_history.filter(
    (match) => match.recipient_name && !match.is_claimed && !match.is_missed
  );

  const undeletedDonations = donations.filter(
    (donation) => !donation.is_deleted
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {role ===  "donor" ? "Your Donations" : "Available Donations"}
          </h1>
          <p className="text-gray-600">
            {role === "donor"
              ? "Track and manage all your food donations"
              : "Find food donations that match your needs"}
          </p>
        </div>

        {/* Main Content */}
        <div className="overflow-hidden">
          {role === "donor" ? (
            <>
            <div className="flex justify-end mb-4">
            <Link to="/donate" className="hidden sm:inline-block">
             <button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-all shadow-md hover:shadow-lg active:scale-95">
               <span className="text-sm md:text-base px-4">New Donation</span>
               <Plus className="mr-1 md:mr-2" size={16} />
             </button>
           </Link>
            </div>
           
           <UploadedDonations
             donations={undeletedDonations}
             onDonationDeleted={handleDonationDeleted}
             onDonationUpdated={handleDonationUpdated}
             auth={{ token: token }}
           />
            </>
          ) : (
            <AllMatches
              profile={profile}
              initialMatches={recipientUnclaimedMatches}
              onClaimSuccess={handleClaimSuccess}
            />
          )}
        </div>


        {/* Empty State Handling */}
        {role === "donor" && undeletedDonations.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Link to="/donate">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              </Link>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No Donations Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
                Click the "+" button to start adding your donations.
            </p>

          </div>
        )}


        {/* {role === "recipient" && recipientUnclaimedMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No Available Donations
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Click the "Find New Donations" button for any updates
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ViewMore;
