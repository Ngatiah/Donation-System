import React, { useState, useEffect, useCallback } from 'react';
import CustomAvatar from '../../UI/Avatar';
import { ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '../../UI/DropdownMenu';
import NotificationBell from '../../notifications/NotificationBell';
import { useDonationActions } from '../../hooks/useDonationActions';

// --- Interfaces ---
interface User {
    name: string;
    role: string;
    email: string;
}

interface TopUser {
    name: string;
    total_quantity_kg: number;
}

interface Profile {
    user: User;
    role: string;
    required_food_type?: string;
    required_quantity?: number;
    organization_name?: string;
    city?: string;
    lat?: number;
    lng?: number;
}

interface DonationMatch {
    id: number;
    donor_name: string;
    recipient_name: string;
    food_type: string;
    matched_quantity: number; // Changed to number
    food_description: string;
    expiry_date: string; // Added for display
    status: 'pending' | 'accepted' | 'fulfilled' | 'declined'; // Crucial for displaying status
}

interface Donation {
    id: number; // Added ID for actions
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
    status: 'pending' | 'matched' | 'fulfilled' | 'declined_by_recipient' | 'unavailable'; // Status of the donation itself
}

interface DashboardData {
    profile: Profile;
    matches: DonationMatch[];
    donations: Donation[]; // These are the donor's uploaded donations
    topUsers: TopUser[];
    // Assuming you might eventually have statistics data here too, or fetch separately
    // stats?: DashboardStatistics;
}

const Dashboard: React.FC = () => {
    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true); // For initial data fetch
    const [error, setError] = useState<string | null>(null); // For initial data fetch errors
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);

    // Use the hook for status updates
    const {
        updateDonationStatus,
        updateMatchStatus,
        statusLoading, // Loading state for status updates
        statusError,   // Error state for status updates
        clearError: clearStatusError // Renamed to avoid clash with local clearError
    } = useDonationActions();


    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                setLoading(false);
                setError("Authentication token not found.");
                return;
            }

            setLoading(true);
            setError(null);
            setNoMatchesMessage(null);

            try {
                // Fetch profile data first
                const res = await fetch("http://localhost:8003/FoodBridge/donations/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                });

                const profileData = await res.json();
                console.log("Fetched profileData (from /donations/):", profileData);

                if (!res.ok) {
                    setError(profileData?.detail || "Failed to fetch profile data");
                    setDashData(null);
                    return;
                }

                let donationData: Donation[] = [];
                let matchData: DonationMatch[] = [];
                let topUsersData: TopUser[] = [];

                if (profileData?.profile?.role === 'donor') {
                    // If donor, fetch their created donations
                    const donorRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${token}`,
                        },
                    });

                    const donorDonations = await donorRes.json();
                    if (!donorRes.ok) {
                        throw new Error(donorDonations?.detail || "Failed to fetch donor donations");
                    }
                    donationData = donorDonations; // Assign to donationData as per your original code
                } else if (profileData?.profile?.role === 'recipient') {
                    // If recipient, fetch donation matches
                    const recipientProfile = profileData.profile;
                    if (!recipientProfile) {
                        throw new Error("Recipient profile not available for matching.");
                    }

                    const quantityToSend = typeof recipientProfile.required_quantity === 'string'
                        ? parseFloat(recipientProfile.required_quantity)
                        : recipientProfile.required_quantity;

                    // This is your current POST request for recipient matches
                    const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
                        method: "POST", // As per your requirement
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${token}`,
                        },
                        body: JSON.stringify({
                            recipient_food_type: recipientProfile.required_food_type,
                            required_quantity: quantityToSend,
                            // Ensure you include any other necessary recipient criteria for matching here
                            lat: recipientProfile.lat, // Assuming your backend expects these
                            lng: recipientProfile.lng
                        }),
                    });

                    const recipientMatches = await matchRes.json();
                    console.log("Fetched recipientMatches (from /donation-matches/ POST):", recipientMatches);

                    if (!matchRes.ok) {
                        if (matchRes.status === 404 && recipientMatches?.message) {
                            setNoMatchesMessage(recipientMatches.message);
                            matchData = [];
                        } else if (matchRes.status === 204 && recipientMatches?.message) {
                            setNoMatchesMessage(recipientMatches.message);
                            matchData = [];
                        } else {
                            setError(recipientMatches?.detail || "Failed to fetch matches");
                            matchData = [];
                        }
                    } else {
                        const receivedMatches: DonationMatch[] = recipientMatches.matches;
                        // Assuming the backend sends unique matches, but keeping your unique logic
                        const uniqueMatches = Array.from(
                            new Map(receivedMatches.map((item: DonationMatch) =>
                                [item.food_type + item.donor_name + item.food_description, item]
                            )).values()
                        );
                        matchData = uniqueMatches;
                    }
                }

                // Fetch Top Users Data (common for both roles)
                const topUsersRes = await fetch("http://8003/FoodBridge/donations/top-users/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                });

                const topUsersJson = await topUsersRes.json();
                if (!topUsersRes.ok) {
                    console.error("Failed to fetch top users:", topUsersJson?.error || topUsersJson?.detail);
                } else {
                    if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
                        topUsersData = topUsersJson.top_recipients;
                    } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
                        topUsersData = topUsersJson.top_donors;
                    }
                }

                // Set all dashboard data
                setDashData({ ...profileData, donations: donationData, matches: matchData, topUsers: topUsersData });

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("An unexpected error occurred while fetching dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        // Re-fetch data when token changes or when a status update completes (due to statusLoading change)
        fetchDashboardData();
    }, [token, statusLoading]);


    // --- HANDLER: Update Match Status (for Recipient actions on their matches) ---
    const handleMatchStatusUpdate = useCallback(async (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => {
        try {
            await updateMatchStatus(matchId, newStatus);
            alert(`Match status updated to ${newStatus}!`);
            // The `useEffect` will re-run because `statusLoading` changes, fetching fresh data.
        } catch (err) {
            alert(`Failed to update match status: ${statusError || (err as Error).message}`);
        }
    }, [updateMatchStatus, statusError]); // Dependencies: updateMatchStatus function and its error state

    // --- HANDLER: Update Donation Status (for Donor actions on their own donations) ---
    const handleDonationStatusUpdate = useCallback(async (donationId: number, newStatus: 'pending' | 'unavailable') => {
        try {
            await updateDonationStatus(donationId, newStatus);
            alert(`Donation status updated to ${newStatus}!`);
            // The `useEffect` will re-run because `statusLoading` changes, fetching fresh data.
        } catch (err) {
            alert(`Failed to update donation status: ${statusError || (err as Error).message}`);
        }
    }, [updateDonationStatus, statusError]);


    // --- Helper for status button colors/styles ---
    const getStatusStyle = useCallback((status: string) => {
        switch (status) {
            case 'pending': return 'bg-blue-500';
            case 'matched': return 'bg-orange-500'; // For Donation status
            case 'accepted': return 'bg-green-500'; // For DonationMatch status
            case 'fulfilled': return 'bg-green-700';
            case 'declined':
            case 'declined_by_recipient': return 'bg-red-500';
            case 'unavailable': return 'bg-gray-500';
            default: return 'bg-blue-500';
        }
    }, []);


    // --- Render Logic ---
    // Show loading state if either initial fetch or a status update is in progress
    if (loading || statusLoading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>;
    // Show error if either initial fetch or a status update failed
    if (error || statusError) return <div>Error: {error || statusError} <button onClick={clearStatusError}>Clear Error</button></div>;
    if (!dashData || !dashData.profile) return null; // Ensure dashData and profile exist before proceeding

    const { profile, matches, donations, topUsers } = dashData;
    const role = profile.role?.toLowerCase();
    // Ensure `donations` (donor's uploaded) and `matches` (recipient's) are properly initialized
    const uploadedDonations = donations || [];
    const recipientMatches = matches || [];


    // Separate matches into categories for better UI organization (Recipient view)
    const recipientConfirmedMatches = recipientMatches.filter(match => match.recipient_name === profile.user.name && (match.status === 'accepted' || match.status === 'fulfilled'));
    const recipientPendingMatches = recipientMatches.filter(match => match.recipient_name === profile.user.name && match.status === 'pending');
    const recipientDeclinedMatches = recipientMatches.filter(match => match.recipient_name === profile.user.name && match.status === 'declined');

    // Matches for Donor (requests they received or matches their donations are part of)
    const donorMatches = matches.filter(match => match.donor_name === profile.user.name);


    return (
        <main className="flex-1 p-6 overflow-auto">
            {/* */}
            <div className="flex items-center w-full justify-end">

                <div className="flex items-center space-x-4 ml-4">
                    <Link to="/donate">
                        {role === 'donor' && <button className="bg-blue-600 text-white px-4 py-2 rounded">New Donation<span className="ml-2 items-center flex"><Plus className='h-8 w-8'/></span>
                        </button>}
                    </Link>

                    <NotificationBell />

                    {/* */}
                    <div className="relative group flex flex-cols">
                        <CustomAvatar />
                        <DropdownMenu >
                            <DropdownMenuTrigger>
                                <ChevronDown className='h-8 w-8 px-1' />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    {profile.user.name} ({profile.role})
                                </DropdownMenuItem>
                                {/* Add other menu items like 'Logout' etc. */}
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
            </div>

            {/* Main Content */}
            {/* */}
            <section className="mb-8">
                <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">{role === 'donor' ? 'Your Uploaded Donations' : 'Available Donations'}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                    {/* Render donations based on role */}
                    <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
                        {/* uploaded donations by donor */}
                        {role === 'donor' && uploadedDonations.length > 0 ? (
                            uploadedDonations.map((donation) => (
                                <div key={donation.id} className="bg-white p-4 rounded-2xl shadow-lg text-left">
                                    <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full h-40 object-cover" />
                                    <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
                                    <div className="text-sm">Quantity: <strong>{donation.quantity} kg</strong></div>
                                    <div className="text-sm">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
                                    <button className={`mt-2 text-white px-3 py-1 rounded text-sm ${getStatusStyle(donation.status)}`}>
                                        Status: {donation.status || 'Pending'}
                                    </button>
                                    {/* Donors might have actions here to mark donation as 'unavailable' or edit if 'pending' */}
                                    {donation.status === 'pending' && (
                                        <button
                                            className="ml-2 mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                            onClick={() => handleDonationStatusUpdate(donation.id, 'unavailable')}
                                            disabled={statusLoading}
                                        >
                                            Mark Unavailable
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            role === 'donor' && <div className="p-6 rounded-lg text-center text-gray-700 col-span-3">
                                <p className="text-lg font-medium italic">No donations uploaded yet.</p>
                                <Link to="/donate" className="text-blue-600 hover:underline mt-4 inline-block">Upload your first donation!</Link>
                            </div>
                        )}

                        {/* matched donations for recipient (These are the *matches* that the recipient has) */}
                        {role === 'recipient' && recipientMatches.length === 0 && !noMatchesMessage ? (
                            // Display message if no matches are found AND no specific noMatchesMessage from backend
                            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-3">
                                <p className="text-lg font-medium">
                                    {noMatchesMessage || "No available donations found matching your criteria at this time. Please check back later or update your required food type."}
                                </p>
                                {/* Optional: Add a link to update profile if needed */}
                                {/* <Link to="/profile-settings" className="text-blue-600 hover:underline mt-4 inline-block">Update Profile</Link> */}
                            </div>
                        ) : null}

                    </div>

                    {/* Top Users list based on role */}
                    <div className="p-4 col-span-1">
                        <h3 className="font-semibold mb-2">
                            {role === 'donor' ? 'Top Recipients' : 'Top Donors'}
                        </h3>
                        <ul className="space-y-2">
                            {topUsers && topUsers.length > 0 ? (
                                topUsers.map((user, i) => (
                                    <li key={i} className="flex justify-between items-center p-4 rounded border border-gray-200">
                                        <CustomAvatar />
                                        <span className='text-base p-2'>{user.name}</span>
                                        <span className='text-base p-2'>{user.total_quantity_kg}kg</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-gray-500 text-center">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
                            )}
                        </ul>
                    </div>

                </div>
            </section>

            {/* Displaying Matches based on Status for RECIPIENTS */}
            {role === 'recipient' && (
                <section className="mb-8">
                    <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Your Match Statuses</h2>

                    {/* Pending Matches (Recipient Needs to Act) */}
                    <h3 className="text-2xl font-semibold mb-3 px-2">Pending Matches</h3>
                    {recipientPendingMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {recipientPendingMatches.map(match => (
                                <div key={match.id} className="bg-yellow-50 p-4 rounded-2xl shadow-lg text-left border border-yellow-200">
                                    <h4 className="font-semibold text-lg text-yellow-700">{match.food_type}</h4>
                                    <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                                    <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
                                    <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                                    <p className="text-sm text-gray-600 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">Status: <strong className={`text-sm font-semibold ${getStatusStyle(match.status)} rounded px-2 py-0.5 text-white`}>{match.status}</strong></p>
                                    <div className="flex space-x-2 mt-3">
                                        <button
                                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                            onClick={() => handleMatchStatusUpdate(match.id, 'accepted')}
                                            disabled={statusLoading}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                                            onClick={() => handleMatchStatusUpdate(match.id, 'declined')}
                                            disabled={statusLoading}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 px-2 mb-6">No pending matches awaiting your action.</p>
                    )}

                    {/* Confirmed Matches (Accepted/Fulfilled by Recipient) */}
                    <h3 className="text-2xl font-semibold mb-3 px-2">Confirmed Matches</h3>
                    {recipientConfirmedMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {recipientConfirmedMatches.map(match => (
                                <div key={match.id} className="bg-green-50 p-4 rounded-2xl shadow-lg text-left border border-green-200">
                                    <h4 className="font-semibold text-lg text-green-700">{match.food_type}</h4>
                                    <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                                    <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
                                    <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                                    <p className="text-sm text-gray-600 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">Status: <strong className={`text-sm font-semibold ${getStatusStyle(match.status)} rounded px-2 py-0.5 text-white`}>{match.status}</strong></p>
                                    {match.status === 'accepted' && ( // Only show 'Mark as Fulfilled' if status is 'accepted'
                                        <button
                                            className="mt-3 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                                            onClick={() => handleMatchStatusUpdate(match.id, 'fulfilled')}
                                            disabled={statusLoading}
                                        >
                                            Mark as Fulfilled
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 px-2 mb-6">No confirmed matches yet.</p>
                    )}

                    {/* Declined Matches */}
                    <h3 className="text-2xl font-semibold mb-3 px-2">Declined Matches</h3>
                    {recipientDeclinedMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {recipientDeclinedMatches.map(match => (
                                <div key={match.id} className="bg-red-50 p-4 rounded-2xl shadow-lg text-left border border-red-200">
                                    <h4 className="font-semibold text-lg text-red-700">{match.food_type}</h4>
                                    <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                                    <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
                                    <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                                    <p className="text-sm text-gray-600 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">Status: <strong className={`text-sm font-semibold ${getStatusStyle(match.status)} rounded px-2 py-0.5 text-white`}>{match.status}</strong></p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 px-2 mb-6">No declined matches.</p>
                    )}
                </section>
            )}


            {/* Displaying Matches based on Status for DONORS */}
            {role === 'donor' && (
                <section className="mb-8">
                    <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Your Match Activity</h2>
                    {donorMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {donorMatches.map(match => (
                                <div key={match.id} className="bg-white p-4 rounded-2xl shadow-lg text-left">
                                    <h4 className="font-semibold text-lg">{match.food_type}</h4>
                                    <p className="text-sm text-gray-600">Recipient: <span className="font-medium">{match.recipient_name}</span></p>
                                    <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
                                    <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                                    <p className="text-sm text-gray-600 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-1">Status: <strong className={`text-sm font-semibold ${getStatusStyle(match.status)} rounded px-2 py-0.5 text-white`}>{match.status}</strong></p>
                                    {/* Donors only need to see the status, as the recipient makes the 'accept'/'decline' actions */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 px-2">No match activity for you as a donor yet.</p>
                    )}
                </section>
            )}

            {/* */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Donation</h4>
                    {/* These are placeholder values. You'll need to fetch real stats from your backend. */}
                    <p className="text-lg font-bold">$1,214,501</p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Donation Today</h4>
                    <p className="text-lg font-bold">$7,925</p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Donor</h4>
                    <p className="text-lg font-bold">2,581</p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Average Donation</h4>
                    <p className="text-lg font-bold">$285.56</p>
                </div>
            </section>

        </main>
    );
};

export default Dashboard;