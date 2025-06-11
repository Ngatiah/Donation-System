import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Plus } from 'lucide-react'; 

interface Profile {
    role: string;
    donor_name:string;
    recipient_name:string;
    required_food_type?: string;
    required_quantity?: number;
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
    is_donation_deleted?: boolean;

}

interface RecipientMatchesProps {
    profile: Profile;
    initialMatches: DonationMatch[]; // Matches fetched by Dashboard initially
    onClaimSuccess: (claimedMatchId: number) => void; // Callback to update Dashboard's state
}

const AllMatches: React.FC<RecipientMatchesProps> = ({ profile, initialMatches, onClaimSuccess }) => {
    console.log("AllMatches: initialMatches received as prop:", initialMatches);
    const [matches, setMatches] = useState<DonationMatch[]>(initialMatches);
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    
    const token = useAuthStore(state => state.token);
    
    // Update matches when initialMatches prop changes (e.g., Dashboard refetches everything)
    useEffect(() => {
        setMatches(initialMatches);
        // Reset message if initial matches are loaded
        if (initialMatches.length > 0) {
            setNoMatchesMessage(null);
        }
    }, [initialMatches]);
    console.log("AllMatches: matches state after useEffect:", matches); // This will show initial load

    // This useEffect ensures that if the initialMatches come in empty,
    // we show the "No matches found" message after the first load.
    useEffect(() => {
        if (!initialMatches.length && !noMatchesMessage && !isGeneratingMatches) {
            setNoMatchesMessage("No available donations found matching your criteria at this time. Click 'Find New Donations' to see if there are new opportunities!");
        }
    }, [initialMatches, noMatchesMessage, isGeneratingMatches]);
    console.log("AllMatches: initialMatches received as prop:", initialMatches);
   console.log("AllMatches: matches state after useEffect:", matches); // This will show initial load


    const claimDonation = async (matchId: number) => {
        if (!token) {
            toast.error("You must be logged in to claim a donation.");
            return;
        }
        try {
            setClaimingId(matchId);
            const response = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/claim/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Donation successfully claimed!');
                // Update local state: mark as claimed
                setMatches(prevMatches =>
                    prevMatches.map(match =>
                        match.id === matchId ? { ...match, is_claimed: true } : match
                    ).filter(match => !match.is_claimed) // Filter out the claimed match from display
                );
                // Call callback to inform parent (Dashboard)
                onClaimSuccess(matchId);
            } else {
                toast.error(data?.detail || data?.message || "Failed to claim donation");
            }
        } catch (err) {
            console.error(`[claimDonation] Unexpected error:`, err);
            toast.error("An unexpected error occurred while claiming donation.");
        } finally {
            setClaimingId(null);
        }
    };

    const generateNewMatches = async () => {
        if (!token || !profile || profile.role !== 'recipient') return;

        setIsGeneratingMatches(true);
        setNoMatchesMessage(null); // Clear previous messages

        try {
            if (!profile.required_food_type || !profile.required_quantity) {
                toast.error("Please set your required food type and quantity in your profile to find matches.");
                return;
            }

            const quantityToSend = typeof profile.required_quantity === 'string'
                ? parseFloat(profile.required_quantity)
                : profile.required_quantity;

            const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    recipient_food_type: profile.required_food_type,
                    required_quantity: quantityToSend,
                }),
            });

            const fetchedMatches = await matchRes.json();

            if (!matchRes.ok) {
                if ((matchRes.status === 200 || matchRes.status === 204) && fetchedMatches?.message) {
                    setNoMatchesMessage(fetchedMatches.message);
                    toast.success(fetchedMatches.message);
                } else if (matchRes.status === 404 && fetchedMatches?.message) {
                    setNoMatchesMessage(fetchedMatches.message);
                    toast.error(fetchedMatches.message);
                } else {
                    toast.error(fetchedMatches?.error || fetchedMatches?.detail || "Failed to generate new matches.");
                }
            } else {
                const newlyGeneratedMatches: DonationMatch[] = fetchedMatches.matches;

                setMatches(prev => {
                    const existingMatchIds = new Set(prev.map(m => m.id));
                    const uniqueNewMatches = newlyGeneratedMatches.filter(m => !existingMatchIds.has(m.id));
                    return [...prev, ...uniqueNewMatches];
                });

                if (newlyGeneratedMatches.length > 0) {
                    toast.success(`${newlyGeneratedMatches.length} new matches generated!`);
                    setNoMatchesMessage(null); // Clear message if matches found
                } else {
                    setNoMatchesMessage("No new matches found based on your current criteria.");
                    toast.error("No new matches found at this time.");
                }
            }
        } catch (err: any) {
            console.error("Error generating new matches:", err);
            toast.error(err.message || "An unexpected error occurred during match generation.");
        } finally {
            setIsGeneratingMatches(false);
        }
    };

    // Filter matches to only show unclaimed ones, for recipients
    // const activeUnclaimedMatches = matches.filter(match =>
    //    match.recipient_name && !match.is_claimed
    // );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
            {profile && profile.role === 'recipient' && (
                <div className="col-span-3 flex justify-end mb-4">
                    <button
                        onClick={generateNewMatches}
                        disabled={isGeneratingMatches}
                        className={`bg-green-600 text-white px-4 py-2 rounded transition ${isGeneratingMatches ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    >
                        {isGeneratingMatches ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Finding Donations...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Find New Donations <Plus className='h-5 w-5' />
                            </span>
                        )}
                    </button>
                </div>
            )}


            {/* {activeUnclaimedMatches.length > 0 ? (
                activeUnclaimedMatches.map((match) => ( */}
                 {matches.length > 0 ? (
                matches.map((match) => (
                    <div key={match.id} className="bg-white p-4 rounded shadow-lg text-left">
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                        <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
                        <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                        {/* <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p> */}
                        <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                        {/* <p className="text-xs text-gray-500 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p> */}
                        {/* <p className="text-xs text-gray-500 mt-1">Expires: {new Date(match.expiry_date).toDateString().slice(4)}</p> */}
                        {/* <p className="text-xs text-gray-500">Matched On: {new Date(match.created_at).toLocaleDateString()}</p> */}
                        <button
                            type='button'
                            className={`mt-3 p-2 font-medium text-sm rounded transition w-full ${
                                match.is_claimed || claimingId === match.id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-yellow-400 text-white hover:bg-yellow-500'
                                }`}
                            disabled={match.is_claimed || claimingId === match.id}
                            onClick={() => claimDonation(match.id)}
                        >
                            {claimingId === match.id ? (
                                <span className="flex items-center justify-center gap-1">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 0 00-4 4H4z"
                                        />
                                    </svg>
                                    Claiming...
                                </span>
                            ) : (
                                match.is_claimed ? "Already Claimed" : "Claim This Donation"
                            )}
                        </button>
                    </div>
                ))
            ) : (
                // Display message when no active matches are found for the recipient
                // <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-3">
                //     <p className="text-lg font-medium">
                //         {noMatchesMessage || "No active matches for your needs at the moment. Click 'Find New Donations' to refresh!"}
                //     </p>
                // </div>
                 <div className="text-gray-500 col-span-3 mt-4 italic">
                  {noMatchesMessage || "No active donations for your needs at the moment.Click 'Find New Donations' to refresh!"}              
               </div>
            )}
        </div>
    );
};

export default AllMatches;