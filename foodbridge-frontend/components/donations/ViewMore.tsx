import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UploadedDonations from './UploadedDonations'; 
import AllMatches from './AllMatches'; 

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
}

interface Donation {
    id: number;
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
    created_at: string;
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
    const token = useAuthStore(state => state.token);

    const fetchViewMoreData = async () => {
        try {
            setError(null);
            setLoading(true);

            // 1. Fetch Profile Data
            const profileRes = await fetch("http://localhost:8003/FoodBridge/donations/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });
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
            if (userProfile.role === 'donor') {
                    const donorDonationsRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${token}`,
                        },
                    });
                    const donorDonationsJson = await donorDonationsRes.json();
                    if (!donorDonationsRes.ok) throw new Error(donorDonationsJson?.detail || "Failed to fetch donor's donations");
                    donationData = donorDonationsJson;
                
            } else if (userProfile.role === 'recipient') {
                 allMatchesHistoryData = responseData.matches
               
            }

            // 3. Fetch full match history for both roles
            const matchHistoryRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-history/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            const matchHistoryJson = await matchHistoryRes.json();
            if (!matchHistoryRes.ok) {
                console.error("Failed to fetch match history:", matchHistoryJson?.detail);
                allMatchesHistoryData = [];
            } else {
                allMatchesHistoryData = matchHistoryJson;
            }

            setViewMoreData({
                profile : userProfile,
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
        setViewMoreData(prevData => {
            if (!prevData) return null;
            const updatedMatches = prevData.all_matches_history.map(match =>
                match.id === claimedMatchId ? { ...match, is_claimed: true } : match
            );
            return { ...prevData, all_matches_history: updatedMatches };
        });
    };

    if (loading) return <div className="animate-pulse text-gray-500 text-center mt-10">Loading detailed information...</div>;
    if (error) return <div className="text-red-600 text-center mt-10">Error: {error}</div>;
    if (!viewMoreData) return null;

    const { profile, all_matches_history, donations } = viewMoreData;
    const role = profile.role;

    if (!role) {
      return <div>Error: User role not found in profile data. Please ensure you are logged in.</div>;
    }


    // Recipients: Unclaimed matches (where they are the recipient and `is_claimed` is false)
    const recipientUnclaimedMatches = all_matches_history.filter(match =>
        match.recipient_name && !match.is_claimed
    );


    return (
        <main className="flex-1 p-6 w-full">
            <h1 className="text-4xl font-bold mb-6 text-center">
                {role === 'donor' ? 'Your Donations' : 'Available Donations'}
            </h1>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full'>
            {role === 'donor' && (
                <UploadedDonations donations={donations} />
            )}

            {role === 'recipient' && (
                <AllMatches
                profile={profile}
                initialMatches={recipientUnclaimedMatches} 
                onClaimSuccess={handleClaimSuccess}
                />
            )}
            </div>

            
        </main>
    );
};

export default ViewMore;